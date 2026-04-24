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

const TAILORABLE_SECTION_PATTERNS = [
  /summary|profil|about|objective/i,
  /work|experience|erfahrung|employment/i,
  /project|projekt/i,
  /skill|kenntnis|kompetenz|technical|ability/i,
];

/**
 * Extract sections that actually need tailoring to reduce prompt size and AI confusion.
 */
function extractTailorableSections(cvJson: JsonResumeSchema) {
  const sections: any = {};
  const keys: string[] = [];

  if (cvJson.basics?.summary) {
    sections.summary = cvJson.basics.summary;
    keys.push('summary');
  }

  if (cvJson.work?.length) {
    sections.work = cvJson.work.map(w => ({ 
        position: w.position, 
        company: w.name, 
        summary: w.summary 
    }));
    keys.push('work');
  }

  if (cvJson.projects?.length) {
    sections.projects = cvJson.projects.map(p => ({ 
        name: p.name, 
        description: p.description 
    }));
    keys.push('projects');
  }

  if (cvJson.skills?.length) {
    sections.skills = cvJson.skills;
    keys.push('skills');
  }

  return { sections, keys };
}

export async function runTailoringPipeline(
  cvJson: JsonResumeSchema,
  jobDescription: string,
  targetRole?: string
): Promise<TailoringPipelineResult> {
  console.log(`[Tailoring] Starting robust pipeline for ${targetRole || 'Potential Role'}...`);

  if (!cvJson) throw new Error("Input CV JSON is empty");

  // 1. JD Analysis (Call 1)
  const jdPrompt = `
Analyze this job description and extract critical tailoring data.

**Job Description:**
---
${jobDescription}
---

Return ONLY valid JSON:
{
  "extractedKeywords": ["skill1", "skill2"],
  "topKeywordsForSummary": ["key1", "key2"],
  "competencyGrid": ["competency1", "competency2"],
  "keywordInjections": [{"cvConcept": "...", "jdKeyword": "..."}],
  "detectedArchetype": "Role Name"
}
`.trim();

  const jdAnalysis = await generateStructuredResponse<JdAnalysisResult>(jdPrompt);
  console.log(`[Tailoring] Phase 1: JD Analysis complete.`);

  // 2. Surgical Content Patch (Call 2)
  const { sections: tailorableSections, keys: tailorableKeys } = extractTailorableSections(cvJson);
  
  const tailoringPrompt = `
Tailor these CV sections for a ${targetRole || jdAnalysis.detectedArchetype} position.

Target Role Context:
- Keywords: ${jdAnalysis.extractedKeywords.join(', ')}
- Summary Focus: ${jdAnalysis.topKeywordsForSummary.join(', ')}
- Competencies: ${jdAnalysis.competencyGrid.join(', ')}

Original CV Sections:
\`\`\`json
${JSON.stringify(tailorableSections, null, 2)}
\`\`\`

RULES:
1. Rewrite "summary" to lead with the top keywords and role archetype.
2. Re-optimize "work" bullets to use JD vocabulary and emphasize relevant impact.
3. Align "projects" with the core competencies of the target role.
4. Update "skills" to prioritize JD requirements.
5. DO NOT invent fake data. Only reformulate existing content.
6. Return a JSON object containing the tailored versions of these keys: ${tailorableKeys.join(', ')}.
`.trim();

  const patch = await generateStructuredResponse<any>(tailoringPrompt);
  console.log(`[Tailoring] Phase 2: Content patch generated.`);

  // 3. Merging and Sanitizing
  const tailoredCv: JsonResumeSchema = {
    ...cvJson,
    basics: { 
        ...cvJson.basics, 
        summary: patch.summary || patch.basics?.summary || cvJson.basics?.summary 
    },
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

  // 4. Change Reporting (Call 3)
  const changesPrompt = `
Briefly summarize the changes made to the CV to match the job.
Original Context: ${cvJson.basics?.summary?.substring(0, 100)}...
New Context: ${tailoredCv.basics?.summary?.substring(0, 100)}...

Return JSON: { "changes": [{ "section": "...", "description": "...", "reason": "..." }] }
`.trim();

  let changes: any[] = [];
  try {
      const changesResult = await generateStructuredResponse<{ changes: any[] }>(changesPrompt);
      changes = changesResult.changes;
  } catch (err) {
      console.warn("[Tailoring] Failed to generate change report, using fallback.");
      changes = [{ 
          section: "General", 
          description: "Optimized entire CV for role alignment", 
          reason: "Increased keyword density and relevance" 
      }];
  }

  console.log(`[Tailoring] Pipeline successfully concluded.`);

  return {
    jdAnalysis,
    tailoredCv,
    changes
  };
}
