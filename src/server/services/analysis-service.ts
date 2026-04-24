import { Types } from 'mongoose';
import CvAnalysis, { ICvAnalysis } from '@/models/CvAnalysis';
import { generateStructuredResponse } from '@/server/ai/gemini';
import { JsonResumeSchema } from '@/types/cv';
import crypto from 'crypto';

const MASTER_ANALYSIS_PROMPT = `
Analyze the provided CV document JSON. Your goal is to perform a comprehensive review covering content, structure, and language.

**Analysis Checks to Perform:**
1. Impact Quantification
2. Grammar and Spelling
3. Keyword Relevance
4. Active Voice Usage
5. Section Completeness
6. Contact Information
...
Return a JSON object with keys corresponding to these checks.
`;

export function generateCvHash(cvJson: JsonResumeSchema): string {
    const normalizedCv = {
        basics: { summary: cvJson.basics?.summary || '' },
        work: (cvJson.work || []).map(w => ({ name: w.name, position: w.position, summary: w.summary })),
        education: (cvJson.education || []).map(e => ({ institution: e.institution, area: e.area })),
        skills: (cvJson.skills || []).map(s => ({ name: s.name, keywords: s.keywords })),
        projects: (cvJson.projects || []).map(p => ({ name: p.name, description: p.description }))
    };
    return crypto.createHash('sha256').update(JSON.stringify(normalizedCv)).digest('hex');
}

/**
 * HEURISTIC ANALYSIS: Analyzes CV without any API calls.
 */
function runHeuristicAnalysis(cvJson: JsonResumeSchema): any {
    const checks: any = {};
    
    // Check 1: Contact Info
    const hasContact = cvJson.basics?.email && cvJson.basics?.phone;
    checks["Contact Information"] = {
        checkName: "Contact Information",
        score: hasContact ? 100 : 50,
        status: hasContact ? "pass" : "warning",
        issues: hasContact ? [] : ["Missing email or phone number."],
        suggestions: hasContact ? [] : ["Ensure your contact details are complete for recruiters."],
        priority: "high"
    };

    // Check 2: Summary
    const summaryLen = cvJson.basics?.summary?.length || 0;
    checks["Summary/Objective Quality"] = {
        checkName: "Summary/Objective Quality",
        score: summaryLen > 100 ? 100 : 40,
        status: summaryLen > 100 ? "pass" : "warning",
        issues: summaryLen > 100 ? [] : ["Professional summary is too short or missing."],
        suggestions: ["Aim for 3-4 sentences highlighting your unique value proposition."],
        priority: "medium"
    };

    // Check 3: Experience
    const workCount = cvJson.work?.length || 0;
    checks["Work Experience"] = {
        checkName: "Work Experience",
        score: workCount > 2 ? 100 : 60,
        status: workCount > 2 ? "pass" : "warning",
        issues: workCount > 0 ? [] : ["No work experience listed."],
        suggestions: ["Add at least 3 relevant roles if possible."],
        priority: "high"
    };

    return checks;
}

export async function performFullAnalysis(
    userId: string,
    cvId: string,
    cvJson: JsonResumeSchema
): Promise<ICvAnalysis> {
    const cvHash = generateCvHash(cvJson);
    const prompt = `${MASTER_ANALYSIS_PROMPT}\n\nCV Data:\n${JSON.stringify(cvJson)}`;

    const analysis = await CvAnalysis.create({
        userId: new Types.ObjectId(userId),
        cvId: new Types.ObjectId(cvId),
        status: 'pending',
        cvHash,
    });

    try {
        const results = await generateStructuredResponse<any>(prompt);
        
        const checkValues = Object.values(results) as any[];
        const scores = checkValues.map(r => r.score).filter(s => typeof s === 'number');
        const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

        analysis.status = 'completed';
        analysis.detailedResults = results;
        analysis.overallScore = overallScore;
        analysis.issueCount = checkValues.reduce((count: number, r: any) => count + (r.issues?.length || 0), 0);
        analysis.analysisDate = new Date();
        await analysis.save();

        return analysis;
    } catch (error: any) {
        if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('400')) {
            console.warn("[Analysis] AI Throttled. Switching to Heuristic Analysis...");
            const results = runHeuristicAnalysis(cvJson);
            analysis.status = 'completed'; // Mark as completed (heuristic)
            analysis.detailedResults = results;
            analysis.overallScore = 70; // Baseline heuristic score
            analysis.issueCount = 2;
            analysis.analysisDate = new Date();
            analysis.errorInfo = "Heuristic fallback active (API Rate Limit)";
            await analysis.save();
            return analysis;
        }
        
        analysis.status = 'failed';
        analysis.errorInfo = error.message;
        await analysis.save();
        throw error;
    }
}

export async function getSectionAnalysis(cvJson: JsonResumeSchema): Promise<Record<string, any>> {
    try {
        const prompt = `Analyze CV sections: work, education, skills. Return JSON with improvement feedback. \n\nCV Data: ${JSON.stringify(cvJson)}`;
        return await generateStructuredResponse<any>(prompt);
    } catch (error) {
        return { work: [], education: [], skills: [] }; // Silent fallback
    }
}

export async function generateRewrite(sectionType: string, currentContent: string, feedback: string): Promise<string> {
    try {
        const prompt = `Improve CV ${sectionType} section. Current: ${currentContent}. Feedback: ${feedback}. Return JSON: { "improvedContent": "..." }`;
        const response = await generateStructuredResponse<{ improvedContent: string }>(prompt);
        return response.improvedContent;
    } catch (error) {
        return currentContent; // Return original on failure
    }
}
