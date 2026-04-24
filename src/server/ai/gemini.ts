import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const analyzeText = async (prompt: string, text: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([prompt, text]);
    return result.response.text();
  } catch (err) {
    console.error("[Gemini] Error:", err);
    return "";
  }
};
