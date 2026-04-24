import { Types } from 'mongoose';
import CvAnalysis, { ICvAnalysis } from '../models/CvAnalysis';
import { generateStructuredResponse } from '../ai/gemini';
import { JsonResumeSchema } from '../../types/cv';

const MASTER_ANALYSIS_PROMPT = `
Analyze the provided CV JSON. Your goal is to perform a comprehensive review covering content, structure, and language.

**Analysis Checks to Perform:**
1. Impact Quantification (metrics)
2. Grammar and Spelling
3. Keyword Relevance
4. Active Voice Usage
5. Buzzwords and Clichés

Return a JSON object with keys corresponding to these checks.
Each key's value MUST be an object with: checkName, score (0-100), issues (array), suggestions (array), status (pass/fail/warning), priority (high/medium/low).
`;

export async function performFullAnalysis(
    userId: string,
    cvId: string,
    cvJson: JsonResumeSchema
): Promise<ICvAnalysis> {
    const prompt = `${MASTER_ANALYSIS_PROMPT}\n\nCV Data:\n${JSON.stringify(cvJson)}`;

    // Create pending analysis
    const analysis = await CvAnalysis.create({
        userId: new Types.ObjectId(userId),
        cvId: new Types.ObjectId(cvId),
        status: 'pending',
    });

    try {
        const results = await generateStructuredResponse<any>(prompt);
        
        // Calculate overall score (simple average for now)
        const scores = Object.values(results).map((r: any) => r.score).filter(s => typeof s === 'number');
        const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const issueCount = Object.values(results).reduce((count: number, r: any) => count + (r.issues?.length || 0), 0);

        analysis.status = 'completed';
        analysis.detailedResults = results;
        analysis.overallScore = overallScore;
        analysis.issueCount = issueCount;
        analysis.analysisDate = new Date();
        await analysis.save();

        return analysis;
    } catch (error: any) {
        analysis.status = 'failed';
        analysis.errorInfo = error.message;
        await analysis.save();
        throw error;
    }
}

export async function getSectionAnalysis(
    cvJson: JsonResumeSchema
): Promise<Record<string, any>> {
    const prompt = `
    Analyze each item in the work experience, education, and skills sections of this CV.
    For each item, evaluate if it "needsImprovement" (boolean) and provide "feedback" (string).
    
    CV Data:
    ${JSON.stringify(cvJson)}
    
    Return a JSON object structured by section name (work, education, skills).
    `;

    return await generateStructuredResponse<any>(prompt);
}
