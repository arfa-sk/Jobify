// src/server/ai/model-resolver.ts
import { GEMINI_API_KEY } from './gemini';

interface GeminiApiModel {
    name: string;
    displayName: string;
    supportedGenerationMethods: string[];
}

let cachedModels: string[] = [];
let lastFetch = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function listAvailableModels(): Promise<string[]> {
    const now = Date.now();
    if (cachedModels.length > 0 && (now - lastFetch < CACHE_TTL)) {
        return cachedModels;
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`Failed to list models: ${response.statusText}`);
        }

        const data = await response.json();
        const models = (data.models || [])
            .filter((m: any) => m.supportedGenerationMethods.includes('generateContent'))
            .map((m: any) => m.name.replace('models/', ''));
        
        cachedModels = models;
        lastFetch = now;
        return models;
    } catch (error) {
        console.error('Error fetching Gemini models:', error);
        // PR #3 Stable Fallbacks
        return ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']; 
    }
}

export async function resolveModelQueue(preference: 'fast' | 'quality' = 'fast'): Promise<string[]> {
    const models = await listAvailableModels();
    
    const scored = models.map(name => {
        let score = 0;
        
        // STABLE TIER: 1.5-flash is the primary workhorse (highest free tier RPM)
        if (name === 'gemini-1.5-flash') score += 1000;
        else if (name.includes('1.5-flash')) score += 900;
        else if (name.includes('1.5')) score += 800;
        
        // EXPERIMENTAL TIER: 2.0 is often restricted (limit: 0) on free tier
        if (name.includes('2.0')) score += 100; // Demoted significantly
        
        if (preference === 'fast') {
            if (name.includes('flash')) score += 50;
        } else {
            if (name.includes('pro')) score += 50;
        }
        
        // Penalties for unstable or non-text models
        if (name.includes('preview') || name.includes('exp') || name.includes('lite')) score -= 300;
        if (name.includes('vision') || name.includes('audio') || name.includes('tuning')) score -= 1000;
        
        return { name, score };
    }).sort((a, b) => b.score - a.score);

    return scored.map(s => s.name);
}

export async function resolveBestModel(preference: 'fast' | 'quality' = 'fast'): Promise<string> {
    const queue = await resolveModelQueue(preference);
    return queue[0] || (preference === 'fast' ? 'gemini-1.5-flash' : 'gemini-1.5-pro');
}
