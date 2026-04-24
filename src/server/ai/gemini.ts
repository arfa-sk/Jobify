import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import * as fs from 'fs';
import axios from 'axios';
import { resolveBestModel, resolveModelQueue } from './model-resolver';

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const XAI_API_KEY = process.env.XAI_API_KEY || '';

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
 * Call Grok (xAI) API - The ultimate fallback
 */
async function callGrok(prompt: string, text: string): Promise<string> {
    if (!XAI_API_KEY) return "";
    try {
        const response = await axios.post(
            'https://api.x.ai/v1/chat/completions',
            {
                model: 'grok-beta',
                messages: [
                    { role: 'system', content: prompt },
                    { role: 'user', content: text }
                ],
                temperature: 0
            },
            {
                headers: {
                    'Authorization': `Bearer ${XAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        const content = response.data.choices[0].message.content || "";
        return content.trim();
    } catch (err: any) {
        console.error("[Grok] Error:", err.response?.data || err.message);
        return "";
    }
}

/**
 * Standard analyze text (With Grok Fallback)
 */
export const analyzeText = async (prompt: string, text: string): Promise<string> => {
  if (!GEMINI_API_KEY && XAI_API_KEY) {
      return await callGrok(prompt, text);
  }

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
    if (XAI_API_KEY) {
        console.log("[AI] Falling back to Grok (xAI)...");
        return await callGrok(prompt, text);
    }
    return "";
  }
};

/**
 * Generate structured JSON response with robust parsing and multiple fallbacks
 */
export async function generateStructuredResponse<T>(
    prompt: string,
    modelName?: string
): Promise<T> {
    const runGemini = async () => {
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
            // Enhanced parsing from PR #3
            console.warn("[Gemini] Direct parse failed, attempting regex extract");
            const firstBrace = text.indexOf('{');
            const lastBrace = text.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                const extracted = text.substring(firstBrace, lastBrace + 1);
                return JSON.parse(extracted) as T;
            }
            throw err;
        }
    };

    const runGrok = async () => {
        if (!XAI_API_KEY) throw new Error("No AI providers available.");
        const raw = await callGrok("Return ONLY valid JSON.", prompt);
        if (!raw) throw new Error("Grok failed to return content.");
        const sanitized = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        return JSON.parse(sanitized) as T;
    };

    try {
        if (!GEMINI_API_KEY && XAI_API_KEY) return await runGrok();
        return await runGemini();
    } catch (err) {
        console.error("[AI] Provider failed, attempting Grok fallback...");
        if (XAI_API_KEY) return await runGrok();
        throw err;
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

    // Final Final Fallback to Grok for general content if all Gemini fail
    if (XAI_API_KEY) {
        console.log("[AI] All Gemini models failed. Using Grok for final attempt...");
        const text = await callGrok("Generate high quality career content.", prompt);
        if (text) return { text };
    }

    throw lastError || new Error('All AI providers failed.');
}

/**
 * Legacy support for file analysis
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
