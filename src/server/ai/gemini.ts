import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import * as fs from 'fs';
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
 * Standard analyze text (Gemini Only)
 */
export const analyzeText = async (prompt: string, text: string): Promise<string> => {
  try {
    const resolvedModel = await resolveBestModel('fast');
    const model = genAI.getGenerativeModel({ 
        model: resolvedModel,
        generationConfig: {
            temperature: 0,
            topP: 0.1,
            topK: 1
        }
    });
    const result = await model.generateContent([prompt, text]);
    return result.response.text();
  } catch (err: any) {
    console.error("[Gemini] Error:", err.message);
    return "";
  }
};

/**
 * Generate structured JSON response using Gemini with enhanced parsing
 */
export async function generateStructuredResponse<T>(
    prompt: string,
    modelName?: string
): Promise<T> {
    const resolvedModel = modelName || await resolveBestModel('quality');
    const model = genAI.getGenerativeModel({ 
        model: resolvedModel,
        generationConfig: { 
            responseMimeType: 'application/json',
            temperature: 0,
            topP: 0.1,
            topK: 1
        }
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
        const cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        return JSON.parse(cleanedText) as T;
    } catch (err) {
        console.warn("[Gemini] Direct parse failed, attempting regex extract");
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            try {
                const extracted = text.substring(firstBrace, lastBrace + 1);
                return JSON.parse(extracted) as T;
            } catch (innerErr) {
                console.error("[Gemini] Regex extract failed.");
            }
        }
        throw new Error('Failed to parse AI response as JSON');
    }
}

/**
 * Generate text content using Gemini with automatic dynamic fallback queue
 */
export async function generateContent(
    prompt: string,
    modelName?: string
): Promise<GenerateContentResult> {
    const modelsToTry = modelName ? [modelName] : await resolveModelQueue('quality');
    let lastError: any;

    for (const modelId of modelsToTry) {
        try {
            console.log(`[Gemini] Attempting with model: ${modelId}`);
            const model = genAI.getGenerativeModel({ 
                model: modelId,
                generationConfig: { 
                    temperature: 0.7,
                    topP: 0.9,
                    topK: 40
                }
            });

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            if (!text) throw new Error('Empty response from AI');

            return {
                text,
                usage: response.usageMetadata ? {
                    promptTokens: response.usageMetadata.promptTokenCount,
                    completionTokens: response.usageMetadata.candidatesTokenCount,
                    totalTokens: response.usageMetadata.totalTokenCount,
                } : undefined
            };
        } catch (error: any) {
            lastError = error;
            console.warn(`[Gemini] ${modelId} failed, cycling...`);
            continue;
        }
    }

    throw lastError || new Error('All Gemini models failed.');
}

/**
 * Support for file analysis
 */
export async function generateContentWithFile(
    prompt: string,
    filePath: string,
    mimeType: string,
    modelName?: string
): Promise<GenerateContentResult> {
    const resolvedModel = modelName || await resolveBestModel('fast');
    const model = genAI.getGenerativeModel({ model: resolvedModel });
    const filePart = {
        inlineData: {
            data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
            mimeType,
        },
    };
    const result = await model.generateContent([prompt, filePart]);
    return { text: result.response.text() };
}
