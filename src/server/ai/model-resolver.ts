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
        return ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']; // Fallbacks
    }
}

export async function resolveModelQueue(preference: 'fast' | 'quality' = 'fast'): Promise<string[]> {
    const models = await listAvailableModels();
    
    const scored = models.map(name => {
        let score = 0;
        
        // Prefer newer versions
        if (name.includes('1.5')) score += 500;
        if (name.includes('2.0')) score += 600;
        if (name.includes('2.5')) score += 700;
        
        if (preference === 'fast') {
            if (name.includes('flash')) score += 100;
            if (name.includes('lite')) score += 50;
        } else {
            if (name.includes('pro')) score += 100;
        }
        
        // Penalties for specialized or unstable models
        if (name.includes('preview') || name.includes('exp')) score -= 200;
        if (name.includes('robotics') || name.includes('vision') || name.includes('audio')) score -= 1000;
        if (name.includes('tuning')) score -= 1000;
        
        return { name, score };
    }).sort((a, b) => b.score - a.score);

    console.log(`[Gemini Resolver] Created queue for ${preference}:`, scored.map(s => `${s.name} (${s.score})`));
    return scored.map(s => s.name);
}

export async function resolveBestModel(preference: 'fast' | 'quality' = 'fast'): Promise<string> {
    const queue = await resolveModelQueue(preference);
    return queue[0] || (preference === 'fast' ? 'gemini-1.5-flash' : 'gemini-1.5-pro');
}
