import { Types } from 'mongoose';
import CvAnalysis, { ICvAnalysis } from '@/models/CvAnalysis';
import { generateStructuredResponse } from '@/server/ai/gemini';
import { JsonResumeSchema } from '@/types/cv';
import crypto from 'crypto';

const MASTER_ANALYSIS_PROMPT = `
Analyze the provided CV document JSON for ATS (Applicant Tracking System) optimization.
Evaluate:
1. Impact (Quantifiable results)
2. Skills density
3. Format and structure
4. Summary impact

Return a JSON object where each key is a check category:
{
  "ATS Formatting": { "checkName": "ATS Formatting", "score": 85, "status": "pass", "issues": [], "suggestions": ["Use standard fonts"] },
  ...
}
`;

export function generateCvHash(cvJson: JsonResumeSchema): string {
    const normalizedCv = {
        basics: { summary: cvJson.basics?.summary || '' },
        work: (cvJson.work || []).map(w => ({ name: w.name, position: w.position, summary: w.summary })),
        skills: (cvJson.skills || []).map(s => ({ name: s.name, keywords: s.keywords })),
    };
    return crypto.createHash('sha256').update(JSON.stringify(normalizedCv)).digest('hex');
}

/**
 * DYNAMIC HEURISTIC ENGINE: Real-time ATS scoring without AI.
 */
function runHeuristicAnalysis(cvJson: JsonResumeSchema): any {
    const checks: any = {};
    let totalScore = 0;
    let issues = 0;

    // Check 1: Impact Metrics (Real ATS Check)
    const workText = (cvJson.work || []).map(w => w.summary).join(' ');
    const hasNumbers = /\b\d+(%|\+)?\b/.test(workText);
    const metricScore = hasNumbers ? 100 : 40;
    totalScore += metricScore;
    if (!hasNumbers) issues++;
    checks["Impact Quantification"] = {
        checkName: "Impact Quantification",
        score: metricScore,
        status: hasNumbers ? "pass" : "fail",
        issues: hasNumbers ? [] : ["Low quantifiable impact. Recruiters look for numbers (% or $)."],
        suggestions: ["Add metrics like 'Increased efficiency by 20%' to bullets."],
        priority: "high"
    };

    // Check 2: Skills Coverage
    const skillCount = (cvJson.skills || []).reduce((acc, s) => acc + (s.keywords?.length || 0), 0);
    const skillScore = skillCount > 15 ? 100 : skillCount > 8 ? 70 : 40;
    totalScore += skillScore;
    if (skillCount < 10) issues++;
    checks["Keyword Density"] = {
        checkName: "Keyword Density",
        score: skillScore,
        status: skillCount > 10 ? "pass" : "warning",
        issues: skillCount > 10 ? [] : ["Low technical keyword density."],
        suggestions: ["Expand your technical skills section with more industry-specific tools."],
        priority: "medium"
    };

    // Check 3: Summary Strength
    const summaryLen = cvJson.basics?.summary?.length || 0;
    const summaryScore = summaryLen > 150 ? 100 : summaryLen > 50 ? 60 : 30;
    totalScore += summaryScore;
    if (summaryLen < 100) issues++;
    checks["Professional Narrative"] = {
        checkName: "Professional Narrative",
        score: summaryScore,
        status: summaryLen > 150 ? "pass" : "warning",
        issues: summaryLen > 150 ? [] : ["Executive summary lacks depth."],
        suggestions: ["Structure your summary to highlight 5+ years of core expertise."],
        priority: "high"
    };

    // Check 4: Contact & Location
    const hasContact = cvJson.basics?.email && cvJson.basics?.location?.city;
    const contactScore = hasContact ? 100 : 50;
    totalScore += contactScore;
    if (!hasContact) issues++;
    checks["ATS Metadata"] = {
        checkName: "ATS Metadata",
        score: contactScore,
        status: hasContact ? "pass" : "fail",
        issues: hasContact ? [] : ["Missing city or email address."],
        suggestions: ["Ensure your location (City, State) is present for local ATS filtering."],
        priority: "medium"
    };

    const overallScore = Math.round(totalScore / 4);
    return { results: checks, overallScore, issueCount: issues };
}

export async function performFullAnalysis(
    userId: string,
    cvId: string,
    cvJson: JsonResumeSchema
): Promise<ICvAnalysis> {
    const cvHash = generateCvHash(cvJson);

    const analysis = await CvAnalysis.create({
        userId: new Types.ObjectId(userId),
        cvId: new Types.ObjectId(cvId),
        status: 'pending',
        cvHash,
    });

    try {
        const prompt = `${MASTER_ANALYSIS_PROMPT}\n\nCV Data:\n${JSON.stringify(cvJson)}`;
        const results = await generateStructuredResponse<any>(prompt);
        
        const checkValues = Object.values(results) as any[];
        let totalScore = 0;
        let validScores = 0;

        checkValues.forEach(r => {
            if (typeof r.score === 'number') {
                totalScore += r.score;
                validScores++;
            } else if (r.status === 'pass') {
                totalScore += 100;
                validScores++;
            } else if (r.status === 'warning') {
                totalScore += 50;
                validScores++;
            } else if (r.status === 'fail') {
                totalScore += 0;
                validScores++;
            }
        });

        const overallScore = validScores > 0 ? Math.round(totalScore / validScores) : 0;

        analysis.status = 'completed';
        analysis.detailedResults = results;
        analysis.overallScore = overallScore;
        analysis.issueCount = checkValues.reduce((count: number, r: any) => count + (r.issues?.length || 0), 0);
        analysis.analysisDate = new Date();
        await analysis.save();
        return analysis;
    } catch (error: any) {
        console.warn("[Analysis] AI Throttled/Failed. Running Dynamic Heuristics...");
        const h = runHeuristicAnalysis(cvJson);
        analysis.status = 'completed';
        analysis.detailedResults = h.results;
        analysis.overallScore = h.overallScore;
        analysis.issueCount = h.issueCount;
        analysis.analysisDate = new Date();
        analysis.errorInfo = "Heuristic mode active";
        await analysis.save();
        return analysis;
    }
}

export async function getSectionAnalysis(cvJson: JsonResumeSchema): Promise<Record<string, any>> {
    try {
        const prompt = `Analyze CV sections. Return JSON with improvement feedback. \n\nCV Data: ${JSON.stringify(cvJson)}`;
        return await generateStructuredResponse<any>(prompt);
    } catch (error) {
        return { work: [], education: [], skills: [] };
    }
}

export async function generateRewrite(sectionType: string, currentContent: string, feedback: string): Promise<string> {
    try {
        const prompt = `Improve CV ${sectionType}. Current: ${currentContent}. Feedback: ${feedback}. Return JSON: { "improvedContent": "..." }`;
        const response = await generateStructuredResponse<{ improvedContent: string }>(prompt);
        return response.improvedContent;
    } catch (error) {
        return currentContent;
    }
}
