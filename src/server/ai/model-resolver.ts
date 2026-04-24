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

export async function resolveBestModel(preference: 'fast' | 'quality' = 'fast'): Promise<string> {
    const models = await listAvailableModels();
    
    // Scoring logic
    const scored = models.map(name => {
        let score = 0;
        if (name.includes('1.5')) score += 500;
        if (name.includes('2.0')) score += 10;
        
        if (preference === 'fast') {
            if (name.includes('flash')) score += 50;
        } else {
            if (name.includes('pro')) score += 50;
        }
        
        if (name.includes('preview') || name.includes('exp')) score -= 100;
        if (name.includes('robotics')) score -= 1000; // Hard penalty for specialized models
        if (name.includes('tts') || name.includes('image')) score -= 500; // Penalty for multi-modal specialized models
        
        return { name, score };
    }).sort((a, b) => b.score - a.score);

    console.log('[Gemini Resolver] Scored models:', scored);
    const selected = scored[0]?.name || (preference === 'fast' ? 'gemini-1.5-flash' : 'gemini-1.5-pro');
    return selected;
}
