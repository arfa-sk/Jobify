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
 * Extract only the sections that typically need tailoring to save tokens.
 */
function extractTailorableSections(cvJson: JsonResumeSchema) {
  return {
    basics: { summary: cvJson.basics?.summary || '' },
    work: (cvJson.work || []).map(w => ({ name: w.name, position: w.position, summary: w.summary })),
    skills: cvJson.skills || []
  };
}

export async function runTailoringPipeline(
  cvJson: JsonResumeSchema,
  jobDescription: string,
  targetRole?: string
): Promise<TailoringPipelineResult> {
  // 1. Call 1: JD Analysis
  const jdPrompt = `
Analyze this job description and extract the following:

**Job Description:**
---
${jobDescription}
---

Return a JSON object with:
- extractedKeywords: 10-15 keywords from the JD (technical terms, skills, action phrases)
- topKeywordsForSummary: top 5 keywords to use in the professional summary
- competencyGrid: 6-8 keyword phrases for the competency grid section
- keywordInjections: array of {cvConcept, jdKeyword} mapping CV concepts to JD vocabulary
- detectedArchetype: detected role type (e.g., Backend Engineer, Project Manager)
`.trim();

  const jdAnalysis = await generateStructuredResponse<JdAnalysisResult>(jdPrompt);

  // 2. Call 2: Surgical Content Patch
  const tailorableSections = extractTailorableSections(cvJson);
  const tailoringPrompt = `
Tailor these CV sections for the role: ${targetRole || 'Target Position'}.

Base CV sections:
\`\`\`json
${JSON.stringify(tailorableSections, null, 2)}
\`\`\`

Job Description Summary:
- Keywords: ${jdAnalysis.extractedKeywords.join(', ')}
- Summary Keywords: ${jdAnalysis.topKeywordsForSummary.join(', ')}
- Competencies: ${jdAnalysis.competencyGrid.join(', ')}

Rules:
1. Rewrite summary using the top 5 keywords. Maintain personal narrative.
2. Reorder work experience bullets to prioritize what this job asks for.
3. Use JD vocabulary (from keywordInjections) to describe existing experience.
4. NEVER invent skills or experience. Only reformulate.
5. All text must be professional and achievement-oriented.

Return a JSON object with the tailored "basics", "work", and "skills" sections.
`.trim();

  const patch = await generateStructuredResponse<any>(tailoringPrompt);

  // 3. Merge Patch with Original CV
  const tailoredCv: JsonResumeSchema = {
    ...cvJson,
    basics: { ...cvJson.basics, summary: patch.basics?.summary || cvJson.basics?.summary },
    work: cvJson.work?.map((w, idx) => ({
      ...w,
      summary: patch.work?.[idx]?.summary || w.summary
    })),
    skills: patch.skills || cvJson.skills
  };

  // 4. Call 3: Change Report
  const changesPrompt = `
Based on the tailoring performed for the role "${targetRole || 'Target Position'}", list the key modifications made.

Return a JSON object with a "changes" array. Each entry must have:
- section: the section key (e.g., "summary", "work", "skills")
- description: one-line summary of what changed (max 60 chars)
- reason: why this change was made, referencing the job requirements (max 60 chars)

Original Snippet: ${cvJson.basics?.summary?.substring(0, 200)}
Tailored Snippet: ${tailoredCv.basics?.summary?.substring(0, 200)}
`.trim();

  const changesResult = await generateStructuredResponse<{ changes: any[] }>(changesPrompt);

  return {
    jdAnalysis,
    tailoredCv,
    changes: changesResult.changes
  };
}
