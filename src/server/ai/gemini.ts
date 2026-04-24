import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const getGeminiModel = (modelName: string = "gemini-1.5-flash") => {
  return genAI.getGenerativeModel({ model: modelName });
};

export const analyzeText = async (prompt: string, text: string) => {
  const model = getGeminiModel();
  const result = await model.generateContent([prompt, text]);
  const response = await result.response;
  return response.text();
};
