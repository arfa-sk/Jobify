import { generateStructuredResponse } from '@/server/ai/gemini';
import { JsonResumeSchema } from '@/types/cv';

export interface JdAnalysisResult {
  extractedKeywords: string[];
  topKeywordsForSummary: string[];
  competencyGrid: string[];
  keywordInjections: Array<{ cvConcept: string; jdKeyword: string }>;
  detectedArchetype: string;
}

export interface TailoringPipelineResult {
  jdAnalysis: JdAnalysisResult;
  tailoredCv: JsonResumeSchema;
  changes: Array<{ section: string; description: string; reason: string }>;
}

/**
 * Extract tailorable sections, ensuring no null crashes.
 */
function extractTailorableSections(cvJson: JsonResumeSchema) {
  return {
    basics: { summary: cvJson.basics?.summary || '' },
    work: (cvJson.work || []).map(w => ({ name: w.name, position: w.position, summary: w.summary })),
    projects: (cvJson.projects || []).map(p => ({ name: p.name, description: p.description })),
    skills: cvJson.skills || []
  };
}

export async function runTailoringPipeline(
  cvJson: JsonResumeSchema,
  jobDescription: string,
  targetRole?: string
): Promise<TailoringPipelineResult> {
  console.log(`[Tailoring] Starting pipeline for ${targetRole || 'Unknown Role'}...`);

  if (!cvJson) throw new Error("Input CV JSON is empty");

  // 1. JD Analysis
  const jdPrompt = `
Analyze this job description and extract critical tailoring data.

**Job Description:**
---
${jobDescription}
---

Return a JSON object with:
- extractedKeywords: 10-15 keywords (tech terms, action phrases)
- topKeywordsForSummary: top 5 keywords for professional summary
- competencyGrid: 6-8 keyword phrases for competency section
- keywordInjections: array of {cvConcept, jdKeyword}
- detectedArchetype: role type (e.g., Software Engineer, Data Analyst)
`.trim();

  const jdAnalysis = await generateStructuredResponse<JdAnalysisResult>(jdPrompt);
  console.log(`[Tailoring] JD Analysis complete. Archetype: ${jdAnalysis.detectedArchetype}`);

  // 2. Surgical Content Patch
  const tailorableSections = extractTailorableSections(cvJson);
  const tailoringPrompt = `
Tailor these CV sections for the role: ${targetRole || jdAnalysis.detectedArchetype}.

Base CV sections:
\`\`\`json
${JSON.stringify(tailorableSections, null, 2)}
\`\`\`

Target JD Context:
- Keywords: ${jdAnalysis.extractedKeywords.join(', ')}
- Summary Keywords: ${jdAnalysis.topKeywordsForSummary.join(', ')}
- Competencies: ${jdAnalysis.competencyGrid.join(', ')}

RULES:
1. Rewrite 'summary' using top keywords.
2. Reorder/Rewrite 'work' bullet points to emphasize relevant achievements.
3. Optimize 'projects' descriptions to align with JD requirements.
4. DO NOT invent facts. Only reformulate existing experience.

Return a JSON object with tailored "basics", "work", "projects", and "skills" sections.
`.trim();

  const patch = await generateStructuredResponse<any>(tailoringPrompt);
  console.log(`[Tailoring] Content patch generated.`);

  // 3. Merge Patch with Original CV
  const tailoredCv: JsonResumeSchema = {
    ...cvJson,
    basics: { ...cvJson.basics, summary: patch.basics?.summary || cvJson.basics?.summary },
    work: cvJson.work?.map((w, idx) => ({
      ...w,
      summary: patch.work?.[idx]?.summary || w.summary
    })),
    projects: cvJson.projects?.map((p, idx) => ({
        ...p,
        description: patch.projects?.[idx]?.description || p.description
    })),
    skills: patch.skills || cvJson.skills
  };

  // 4. Change Report
  const changesPrompt = `
Compare the original and tailored summary and list the top 3-5 high-impact changes made.
Original: ${cvJson.basics?.summary?.substring(0, 150)}...
Tailored: ${tailoredCv.basics?.summary?.substring(0, 150)}...

Return a JSON object with a "changes" array of {section, description, reason}.
`.trim();

  const changesResult = await generateStructuredResponse<{ changes: any[] }>(changesPrompt);

  return {
    jdAnalysis,
    tailoredCv,
    changes: changesResult.changes
  };
}
