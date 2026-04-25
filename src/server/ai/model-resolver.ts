// src/server/ai/model-resolver.ts
import { GEMINI_API_KEY } from './gemini';

export async function resolveModelQueue(preference: 'fast' | 'quality' = 'fast'): Promise<string[]> {
    // Using the exact models discovered in the API diagnostic
    if (preference === 'fast') {
        return [
            'gemini-1.5-flash',
            'gemini-2.5-flash',
            'gemini-2.0-flash'
        ];
    } else {
        return [
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'gemini-2.5-pro',
            'gemini-2.0-flash'
        ];
    }
}

export async function resolveBestModel(preference: 'fast' | 'quality' = 'fast'): Promise<string> {
    const queue = await resolveModelQueue(preference);
    return queue[0];
}

export async function listAvailableModels(): Promise<string[]> {
    return [
        'gemini-2.0-flash',
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-flash-latest',
        'gemini-pro-latest'
    ];
}
