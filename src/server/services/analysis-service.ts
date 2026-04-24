import { Types } from 'mongoose';
import CvAnalysis, { ICvAnalysis } from '@/models/CvAnalysis';
import { generateStructuredResponse } from '@/server/ai/gemini';
import { JsonResumeSchema } from '@/types/cv';
import crypto from 'crypto';

const MASTER_ANALYSIS_PROMPT = `
Analyze the provided CV document JSON. Your goal is to perform a comprehensive review covering content, structure, and language.

**Analysis Checks to Perform:**

1.  **Impact Quantification:** Identify achievements (Work & Projects) that lack specific metrics. Priority: high.
2.  **Grammar and Spelling:** Check for grammatical errors and typos across all text. Priority: high.
3.  **Keyword Relevance:** Check if industry-specific keywords are present in Skills, Work, and Projects. Priority: high.
4.  **Active Voice Usage:** Focus on achievement descriptions in Work and Projects. Priority: medium.
5.  **Buzzwords and Clichés:** Look for overused phrases across all narrative sections. Priority: medium.
6.  **Section Completeness:** Verify all sections (Summary, Work, Education, Skills, Projects, Certificates) are present and robust. Priority: high.
7.  **Contact Information:** Verify presence of name, phone, email, location. Priority: high.
8.  **Summary/Objective Quality:** Evaluate relevance and impact of the professional summary. Priority: medium.
9.  **Technical Arsenal:** Check logical grouping of Skills and alignment with the experience shown. Priority: medium.
10. **Evidence of Growth:** Look for progression and increasing responsibility across the career timeline. Priority: medium.

Return a JSON object with keys corresponding to these checks.
Each key's value MUST be an object with: "checkName", "score" (0-100), "issues" (array), "suggestions" (array), "status" ("pass", "fail", "warning"), and "priority" ("high", "medium", "low").
`;

export function generateCvHash(cvJson: JsonResumeSchema): string {
    // Zero-loss normalized object for hashing
    const normalizedCv = {
        basics: { summary: cvJson.basics?.summary || '' },
        work: (cvJson.work || []).map(w => ({ name: w.name, position: w.position, summary: w.summary })),
        education: (cvJson.education || []).map(e => ({ institution: e.institution, area: e.area })),
        skills: (cvJson.skills || []).map(s => ({ name: s.name, keywords: s.keywords })),
        projects: (cvJson.projects || []).map(p => ({ name: p.name, description: p.description })),
        certificates: (cvJson.certificates || []).map(c => ({ name: c.name, issuer: c.issuer })),
        languages: (cvJson.languages || []).map(l => ({ language: l.language, fluency: l.fluency }))
    };
    return crypto.createHash('sha256').update(JSON.stringify(normalizedCv)).digest('hex');
}

export async function performFullAnalysis(
    userId: string,
    cvId: string,
    cvJson: JsonResumeSchema
): Promise<ICvAnalysis> {
    const cvHash = generateCvHash(cvJson);
    const prompt = `${MASTER_ANALYSIS_PROMPT}\n\nCV Data:\n${JSON.stringify(cvJson)}`;

    // Create pending analysis
    const analysis = await CvAnalysis.create({
        userId: new Types.ObjectId(userId),
        cvId: new Types.ObjectId(cvId),
        status: 'pending',
        cvHash,
    });

    try {
        const results = await generateStructuredResponse<any>(prompt);
        
        // Calculate scores
        const checkValues = Object.values(results) as any[];
        const scores = checkValues.map(r => r.score).filter(s => typeof s === 'number');
        const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const issueCount = checkValues.reduce((count: number, r: any) => count + (r.issues?.length || 0), 0);

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
    
    Return a JSON object with sections: "work", "education", "skills".
    Each section should be an array of feedback objects matching the input array length.
    
    CV Data:
    ${JSON.stringify(cvJson)}
    `;

    return await generateStructuredResponse<any>(prompt);
}

export async function generateRewrite(
    sectionType: string,
    currentContent: string,
    feedback: string
): Promise<string> {
    const prompt = `
    You are a professional CV writer. Improve this CV ${sectionType} section based on the feedback provided.
    Maintain a professional, achievement-oriented tone using active voice and metrics where possible.
    
    Current Content:
    ${currentContent}
    
    Feedback to address:
    ${feedback}
    
    Return ONLY the improved content in a JSON object: { "improvedContent": "..." }
    `;

    const response = await generateStructuredResponse<{ improvedContent: string }>(prompt);
    return response.improvedContent;
}
