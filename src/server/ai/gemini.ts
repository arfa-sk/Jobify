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
 * Convert file path to Gemini Part object
 */
function fileToGenerativePart(filePath: string, mimeType: string): Part {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
            mimeType,
        },
    };
}

/**
 * Generate content with file input using Gemini
 */
export async function generateContentWithFile(
    prompt: string,
    filePath: string,
    mimeType: string,
    modelName?: string
): Promise<GenerateContentResult> {
    const resolvedModel = modelName || await resolveBestModel('fast');
    console.log(`[Gemini] Using model: ${resolvedModel}`);
    const model = genAI.getGenerativeModel({ 
        model: resolvedModel,
        generationConfig: { 
            temperature: 0,
            topP: 0.1,
            topK: 1
        }
    });
    const filePart = fileToGenerativePart(filePath, mimeType);
    const textPart: Part = { text: prompt };
    const parts: Part[] = [textPart, filePart];

    const result = await model.generateContent({
        contents: [{ role: 'user', parts }],
    });
    const response = result.response;
    const text = response.text();

    return {
        text,
        usage: response.usageMetadata ? {
            promptTokens: response.usageMetadata.promptTokenCount,
            completionTokens: response.usageMetadata.candidatesTokenCount,
            totalTokens: response.usageMetadata.totalTokenCount,
        } : undefined
    };
}

/**
 * Generate structured JSON response using Gemini.
 */
export async function generateStructuredResponse<T>(
    prompt: string,
    modelName?: string
): Promise<T> {
    const resolvedModel = modelName || await resolveBestModel('quality');
    console.log(`[Gemini] Using structured model: ${resolvedModel}`);
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
    const response = result.response;
    const text = response.text();

    try {
        const cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        return JSON.parse(cleanedText) as T;
    } catch (err) {
        console.warn("[Gemini] Direct parse failed, attempting regex extract on:", text.substring(0, 50) + "...");
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            try {
                const extracted = text.substring(firstBrace, lastBrace + 1);
                return JSON.parse(extracted) as T;
            } catch (innerErr) {
                console.error("[Gemini] Deep regex extract failed.");
            }
        }
        throw new Error('Failed to parse AI response as JSON. Raw output: ' + text.substring(0, 100));
    }
}

/**
 * Generate text content using Gemini (text-only) with automatic dynamic fallback
 */
export async function generateContent(
    prompt: string,
    modelName?: string
): Promise<GenerateContentResult> {
    // Get the full queue of models we have access to
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
            const errorMsg = error.message?.toLowerCase() || '';
            const isRateLimit = errorMsg.includes('429') || errorMsg.includes('quota');
            const isNotFound = errorMsg.includes('404') || errorMsg.includes('not found');
            const isSafety = errorMsg.includes('safety') || errorMsg.includes('finish_reason_safety');
            
            if (isRateLimit || isNotFound || isSafety) {
                console.warn(`[Gemini] ${modelId} failed (${isRateLimit ? 'Rate Limit' : isNotFound ? 'Not Found' : 'Safety'}). Cycling to next available model...`);
                continue; 
            }
            
            throw error;
        }
    }

    throw lastError || new Error('All available Gemini models failed to generate content.');
}
