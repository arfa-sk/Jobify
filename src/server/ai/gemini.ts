import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import * as fs from 'fs';
import axios from 'axios';
import { resolveBestModel, resolveModelQueue } from './model-resolver';

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface GenerateContentResult {
    text: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

/**
 * Direct fetch call to Gemini v1 API (Bypassing SDK for maximum reliability)
 */
async function callGeminiDirect(modelId: string, payload: any): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1/models/${modelId}:generateContent?key=${GEMINI_API_KEY}`;
    try {
        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        const candidate = response.data.candidates?.[0];
        if (!candidate) throw new Error("No candidates returned from Gemini");
        
        return candidate.content.parts[0].text;
    } catch (err: any) {
        const status = err.response?.status;
        const msg = err.response?.data?.error?.message || err.message;
        throw new Error(`[Gemini API ${status || 'Error'}] ${msg}`);
    }
}

/**
 * Standard analyze text
 */
export const analyzeText = async (prompt: string, text: string): Promise<string> => {
  try {
    const modelId = await resolveBestModel('fast');
    const payload = {
        contents: [{
            parts: [{ text: prompt + "\n\n" + text }]
        }],
        generationConfig: { temperature: 0, topP: 0.1, topK: 1 }
    };
    return await callGeminiDirect(modelId, payload);
  } catch (err: any) {
    console.error("[Gemini] Error:", err.message);
    return "";
  }
};

/**
 * Generate structured JSON response with direct API calls
 */
export async function generateStructuredResponse<T>(
    prompt: string,
    modelName?: string
): Promise<T> {
    const modelsToTry = modelName ? [modelName] : await resolveModelQueue('quality');
    let lastError: any;

    for (const modelId of modelsToTry) {
        try {
            const payload = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { 
                    responseMimeType: 'application/json',
                    temperature: 0,
                    topP: 0.1,
                    topK: 1
                }
            };
            const text = await callGeminiDirect(modelId, payload);
            const cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            return JSON.parse(cleanedText) as T;
        } catch (err: any) {
            lastError = err;
            try {
                const text = err.message || "";
                const firstBrace = text.indexOf('{');
                const lastBrace = text.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1) {
                    return JSON.parse(text.substring(firstBrace, lastBrace + 1)) as T;
                }
            } catch (inner) {}
            continue;
        }
    }
    throw lastError || new Error('All Gemini models failed for structured response.');
}

/**
 * Generate text content using Gemini with automatic dynamic fallback
 */
export async function generateContent(
    prompt: string,
    modelName?: string
): Promise<GenerateContentResult> {
    const modelsToTry = modelName ? [modelName] : await resolveModelQueue('quality');
    let lastError: any;

    for (const modelId of modelsToTry) {
        try {
            const payload = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, topP: 0.9, topK: 40 }
            };
            const text = await callGeminiDirect(modelId, payload);
            return { text };
        } catch (error: any) {
            lastError = error;
            continue;
        }
    }
    throw lastError || new Error('All Gemini models failed.');
}

/**
 * Optimized file analysis using direct API calls (Force v1)
 */
export async function generateContentWithFile(
    prompt: string,
    filePath: string,
    mimeType: string,
    modelName?: string
): Promise<GenerateContentResult> {
    const modelsToTry = modelName ? [modelName] : await resolveModelQueue('fast');
    let lastError: any;

    const base64Data = Buffer.from(fs.readFileSync(filePath)).toString('base64');
    
    for (const modelId of modelsToTry) {
        try {
            console.log(`[Gemini] Direct v1 attempt with model: ${modelId}`);
            const payload = {
                contents: [{
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType, data: base64Data } }
                    ]
                }],
                generationConfig: {
                    temperature: 0,
                    topP: 0.1,
                    topK: 1
                }
            };
            
            const text = await callGeminiDirect(modelId, payload);
            return { text };
        } catch (error: any) {
            lastError = error;
            console.warn(`[Gemini] Direct ${modelId} failed:`, error.message);
            continue;
        }
    }

    throw lastError || new Error('All models failed for file analysis.');
}
