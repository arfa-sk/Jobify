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
 * Uses a surgical approach to mimic professional rewriting.
 */
function runHeuristicTailoring(cvJson: JsonResumeSchema, jobDescription: string): TailoringPipelineResult {
    console.log("[Tailoring] Engaging Genuine Heuristic Engine...");
    
    // 1. Advanced Keyword Extraction
    const keywords = new Set<string>();
    const techPatterns = [
        /\b(React|Next\.js|TypeScript|Node\.js|Python|AWS|Docker|Kubernetes|SQL|Java|Tailwind|Vue|Angular|Go|Rust|DevOps|Frontend|Backend|Fullstack|UI\/UX|Figma|Product Management|Agile|Scrum)\b/gi,
        /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g // Proper nouns
    ];

    techPatterns.forEach(p => {
        const matches = jobDescription.match(p);
        if (matches) matches.forEach(m => {
            if (m.length > 2 && m.length < 20) keywords.add(m);
        });
    });

    const topKeywords = Array.from(keywords).slice(0, 12);
    const archetype = jobDescription.match(/\b(Senior|Junior|Lead|Principal|Staff)?\s*([A-Za-z]+\s+(Developer|Engineer|Designer|Manager|Analyst|Consultant))\b/i)?.[0] || "Target Role";

    // 2. Surgical Tailoring
    const tailoredCv = JSON.parse(JSON.stringify(cvJson)) as JsonResumeSchema;
    const changes: Array<{ section: string; description: string; reason: string }> = [];
    
    if (tailoredCv.basics) {
        const originalSummary = tailoredCv.basics.summary || "";
        const prefix = `Highly skilled ${archetype} specializing in ${topKeywords.slice(0, 4).join(', ')}. `;
        tailoredCv.basics.summary = `${prefix}${originalSummary}`.substring(0, 800);
        changes.push({ section: "Summary", description: "Injected role-specific archetype and core tech stack prefix.", reason: "To immediately signal fit to recruiters/ATS." });
    }

    // 3. Skills Injection (Clean and Professional)
    if (topKeywords.length > 0) {
        if (!tailoredCv.skills) tailoredCv.skills = [];
        tailoredCv.skills.unshift({
            name: "Priority Qualifications",
            keywords: topKeywords,
            level: "Mastery"
        });
        changes.push({ section: "Skills", description: `Added 'Priority Qualifications' with: ${topKeywords.join(', ')}`, reason: "Keywords matched from Job Description." });
    }

    // 4. Experience Tweaking
    if (tailoredCv.work && tailoredCv.work.length > 0) {
        const original = tailoredCv.work[0].summary || "";
        tailoredCv.work[0].summary = `Driving initiatives in ${topKeywords.slice(0, 3).join(' and ')} to deliver high-impact solutions. ${original}`;
        changes.push({ section: "Experience", description: "Modified lead role summary to emphasize JD tech stack.", reason: "Aligning past experience with current job requirements." });
    }

    return {
        jdAnalysis: {
            extractedKeywords: topKeywords,
            detectedArchetype: archetype,
            competencyFocus: topKeywords[0] || "General Alignment"
        },
        tailoredCv,
        changes,
        outreach: {
            coverLetter: `To whom it may concern,\n\nI am writing to express my interest in the ${archetype} position. With my background in ${topKeywords.slice(0, 3).join(' and ')}, I am confident that I can contribute effectively to your team.\n\n[Note: This is a heuristic fallback letter due to API limits]`,
            outreachEmail: `Hi there, I just applied for the ${archetype} role. I have extensive experience in ${topKeywords.slice(0, 2).join(' and ')} and would love to chat briefly.`
        },
        mode: 'HEURISTIC'
    };
}

/**
 * Consistently extract tailorable sections for optimization.
 */
function getTailorableContext(cvJson: JsonResumeSchema) {
  return {
    basics: {
        name: cvJson.basics?.name || "Candidate",
        summary: cvJson.basics?.summary || ""
    },
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
    console.log(`[Tailoring] Running Optimized ${includeOutreach ? 'Full-Suite' : 'Surgical'} AI Pipeline...`);
    const context = getTailorableContext(cvJson);
    const megaPrompt = `
You are an expert Career Strategist and CV Optimization Engine. 
Surgically tailor the CV for the provided Job Description (JD).

**JOB DESCRIPTION:**
---
${jobDescription.substring(0, 3000)}
---

**ORIGINAL CV CONTEXT:**
---
${JSON.stringify(context, null, 2)}
---

**OUTPUT FORMAT (JSON ONLY):**
{
  "analysis": { "extractedKeywords": [], "detectedArchetype": "", "competencyFocus": "" },
  "tailoredSections": { "summary": "", "work": [], "projects": [], "skills": [] },
  "changeLog": [ { "section": "", "description": "", "reason": "" } ],
  "outreach": { "coverLetter": "", "outreachEmail": "" }
}
`.trim();

    const result = await generateStructuredResponse<any>(megaPrompt);
    
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
    if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('blocked') || error.message?.includes('400')) {
        return runHeuristicTailoring(cvJson, jobDescription);
    }
    throw error;
  }
}
