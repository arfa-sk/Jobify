import { generateContent, generateStructuredResponse } from '../ai/gemini';
import { ICV } from '@/models/CV';
import { IJob } from '@/models/Job';

export async function generateCoverLetter(
    job: IJob,
    cv: ICV,
    mode: 'pro' | 'thorough'
): Promise<string> {
    const cvContext = JSON.stringify(cv.cvJson || cv.cvData);
    
    const wordCount = mode === 'pro' ? '100-120' : '200-300';
    const tone = mode === 'pro' ? 'concise, punchy, and modern' : 'detailed, narrative, and persuasive';

    const prompt = `
        You are a world-class career coach. Write a highly professional cover letter for a job application.
        
        CONTEXT:
        Job Title: ${job.title}
        Company: ${job.company}
        Job Description: ${job.description}
        
        CANDIDATE DATA (JSON):
        ${cvContext}
        
        CONSTRAINTS:
        - Mode: ${mode}
        - Word count: ${wordCount} words
        - Tone: ${tone}
        - Output format: Plain text only (no markdown, no bolding, no headers like [Subject]).
        - Start directly with "Dear [Hiring Manager Name or Team],"
        - Ensure it highlights relevant skills from the candidate data that match the job description.
        - Be ATS-friendly and professional.
    `;

    try {
        const result = await generateContent(prompt);
        if (!result.text) throw new Error('AI returned empty response');
        return result.text;
    } catch (error: any) {
        console.error('Error generating cover letter:', error.message);
        throw new Error(`Failed to generate cover letter via AI: ${error.message}`);
    }
}
