import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import * as fs from 'fs';
import axios from 'axios';
import { resolveBestModel } from './model-resolver';

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
 * Call Grok (xAI) API
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
  // If Gemini is blocked or missing, try Grok first if key exists
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
    
    // Fallback to Grok if Gemini fails (e.g., 403 Blocked)
    if (XAI_API_KEY) {
        console.log("[AI] Falling back to Grok (xAI)...");
        return await callGrok(prompt, text);
    }
    
    return "";
  }
};

/**
 * Generate structured JSON response (With Grok Fallback)
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
        return JSON.parse(text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim());
    };

    const runGrok = async () => {
        if (!XAI_API_KEY) throw new Error("No AI providers available.");
        const raw = await callGrok("Return ONLY valid JSON.", prompt);
        if (!raw) throw new Error("Grok failed to return content.");
        const sanitized = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        return JSON.parse(sanitized);
    };

    try {
        if (!GEMINI_API_KEY && XAI_API_KEY) return await runGrok();
        return await runGemini();
    } catch (err) {
        console.error("[AI] Provider failed, attempting fallback...");
        if (XAI_API_KEY) return await runGrok();
        throw err;
    }
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
