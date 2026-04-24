import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import * as fs from 'fs';
import { resolveBestModel } from './model-resolver';

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
        return JSON.parse(text) as T;
    } catch (err) {
        // Fallback: try to extract JSON if it's wrapped in markdown fences
        const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
        const match = text.match(jsonRegex);
        if (match && match[1]) {
            return JSON.parse(match[1].trim()) as T;
        }
        throw new Error('Failed to parse AI response as JSON');
    }
}
