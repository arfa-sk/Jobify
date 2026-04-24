import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function listModels() {
    console.log('Testing API Key:', GEMINI_API_KEY.substring(0, 5) + '...');
    try {
        // The listModels method is not directly on genAI in some versions, 
        // but we can try to fetch a known model to see if it works.
        const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-pro'];
        
        for (const m of models) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                await model.generateContent('test');
                console.log(`✅ Model ${m} is AVAILABLE`);
            } catch (err: any) {
                console.log(`❌ Model ${m} failed: ${err.message}`);
            }
        }
    } catch (err: any) {
        console.error('General Error:', err.message);
    }
}

listModels();
