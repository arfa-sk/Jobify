import { generateStructuredResponse } from '@/server/ai/gemini';
import { JsonResumeSchema } from '@/types/cv';

export interface TailoringPipelineResult {
  jdAnalysis: {
    extractedKeywords: string[];
    detectedArchetype: string;
    competencyFocus: string;
  };
  tailoredCv: JsonResumeSchema;
  changes: Array<{ section: string; description: string; reason: string }>;
  outreach?: {
    coverLetter: string;
    outreachEmail: string;
  };
  mode?: 'AI' | 'HEURISTIC';
}

/**
 * GENUINE HEURISTIC ENGINE: Tailors CV without any API calls.
 */
function runHeuristicTailoring(cvJson: JsonResumeSchema, jobDescription: string): TailoringPipelineResult {
    console.log("[Tailoring] Engaging Genuine Heuristic Engine...");
    const keywords = new Set<string>();
    const techPatterns = [
        /\b(React|Next\.js|TypeScript|Node\.js|Python|AWS|Docker|Kubernetes|SQL|Java|Tailwind|Vue|Angular|Go|Rust|DevOps|Frontend|Backend|Fullstack|UI\/UX|Figma|Product Management|Agile|Scrum)\b/gi
    ];
    techPatterns.forEach(p => {
        const matches = jobDescription.match(p);
        if (matches) matches.forEach(m => keywords.add(m));
    });
    const topKeywords = Array.from(keywords).slice(0, 12);
    const archetype = jobDescription.match(/\b(Senior|Junior|Lead|Principal|Staff)?\s*([A-Za-z]+\s+(Developer|Engineer|Designer|Manager|Analyst|Consultant))\b/i)?.[0] || "Target Role";

    const tailoredCv = JSON.parse(JSON.stringify(cvJson)) as JsonResumeSchema;
    const changes: Array<{ section: string; description: string; reason: string }> = [];
    
    if (tailoredCv.basics) {
        const originalSummary = tailoredCv.basics.summary || "";
        const prefix = `Highly skilled ${archetype} specializing in ${topKeywords.slice(0, 4).join(', ')}. `;
        tailoredCv.basics.summary = `${prefix}${originalSummary}`.substring(0, 800);
        changes.push({ section: "Summary", description: "Injected role-specific archetype and core tech stack prefix.", reason: "To immediately signal fit." });
    }

    if (topKeywords.length > 0) {
        if (!tailoredCv.skills) tailoredCv.skills = [];
        tailoredCv.skills.unshift({ name: "Priority Qualifications", keywords: topKeywords, level: "Mastery" });
        changes.push({ section: "Skills", description: `Added 'Priority Qualifications' with matched keywords.`, reason: "JD Alignment." });
    }

    return {
        jdAnalysis: { extractedKeywords: topKeywords, detectedArchetype: archetype, competencyFocus: topKeywords[0] || "General" },
        tailoredCv,
        changes,
        outreach: {
            coverLetter: `To whom it may concern,\n\nI am interested in the ${archetype} position...`,
            outreachEmail: `Hi, I just applied for the ${archetype} role...`
        },
        mode: 'HEURISTIC'
    };
}

function getTailorableContext(cvJson: JsonResumeSchema) {
  return {
    basics: { name: cvJson.basics?.name || "Candidate", summary: cvJson.basics?.summary || "" },
    work: (cvJson.work || []).map(w => ({ position: w.position, company: w.name, summary: w.summary })),
    projects: (cvJson.projects || []).map(p => ({ name: p.name, description: p.description })),
    skills: cvJson.skills || []
  };
}

export async function runTailoringPipeline(
  cvJson: JsonResumeSchema,
  jobDescription: string,
  options: { targetRole?: string; includeOutreach?: boolean } = {}
): Promise<TailoringPipelineResult> {
  const { targetRole, includeOutreach = false } = options;
  if (!cvJson) throw new Error("Input CV JSON is empty");

  try {
    const context = getTailorableContext(cvJson);
    const megaPrompt = `
You are an expert Career Strategist and CV Optimization Engine. 
Surgically tailor the CV for the provided Job Description (JD).

**JOB DESCRIPTION:**
${jobDescription.substring(0, 3000)}

**ORIGINAL CV CONTEXT:**
${JSON.stringify(context, null, 2)}

**OUTPUT FORMAT (JSON ONLY):**
{
  "analysis": { "extractedKeywords": [], "detectedArchetype": "", "competencyFocus": "" },
  "tailoredSections": { "summary": "", "work": [], "projects": [], "skills": [] },
  "changeLog": [ { "section": "", "description": "", "reason": "" } ],
  "outreach": { "coverLetter": "", "outreachEmail": "" }
}
`.trim();

    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("TAILOR_TIMEOUT")), 8000)
    );

    const result = await Promise.race([
        generateStructuredResponse<any>(megaPrompt),
        timeoutPromise
    ]) as any;
    
    const tailoredCv: JsonResumeSchema = {
      ...cvJson,
      basics: { ...cvJson.basics, summary: result.tailoredSections.summary || cvJson.basics?.summary },
      work: cvJson.work?.map((w, idx) => ({ ...w, summary: result.tailoredSections.work?.[idx] || w.summary })),
      projects: cvJson.projects?.map((p, idx) => ({ ...p, description: result.tailoredSections.projects?.[idx] || p.description })),
      skills: result.tailoredSections.skills || cvJson.skills
    };

    return {
      jdAnalysis: result.analysis,
      tailoredCv,
      changes: result.changeLog || [],
      outreach: result.outreach,
      mode: 'AI'
    };
  } catch (error: any) {
    if (error.message === "TAILOR_TIMEOUT" || error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('400')) {
        console.warn(`[Tailoring] AI ${error.message === "TAILOR_TIMEOUT" ? "Timed Out" : "Failed"}. Switching to Heuristic...`);
        return runHeuristicTailoring(cvJson, jobDescription);
    }
    throw error;
  }
}
