import { analyzeText } from "./gemini";
import type { ParsedJob } from "@/server/pipeline/parser";

export interface CandidateProfile {
  desiredRole?: string;
  desiredLocation?: string;
  experienceLevel?: string;
  cvText?: string;
}

export interface JobAIInsights {
  relevanceScore: number;
  aiSummary: string;
  companyInsights: string;
  requiredSkills: string[];
  tags: string[];
}

function extractJson(text: string): string {
  const cleaned = text.trim();
  if (cleaned.startsWith("{") && cleaned.endsWith("}")) return cleaned;
  const jsonBlock = cleaned.match(/\{[\s\S]*\}/);
  return jsonBlock?.[0] ?? "{}";
}

function clampScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function analyzeJobFit(
  job: Pick<ParsedJob, "title" | "company" | "location" | "description" | "url">,
  profile: CandidateProfile
): Promise<JobAIInsights> {
  if (!process.env.GEMINI_API_KEY) {
    return {
      relevanceScore: 0,
      aiSummary: "",
      companyInsights: "",
      requiredSkills: [],
      tags: [],
    };
  }

  const prompt = `You are an expert recruiting assistant.
Analyze this job and return ONLY valid JSON with these keys:
{
  "relevanceScore": number (0-100),
  "aiSummary": string (max 180 chars),
  "companyInsights": string (max 220 chars),
  "requiredSkills": string[],
  "tags": string[]
}
Use desired role/location/experience/cv to score relevance.
Do not include markdown.`;

  const payload = `Candidate:
- Desired Role: ${profile.desiredRole || "Not specified"}
- Desired Location: ${profile.desiredLocation || "Not specified"}
- Experience Level: ${profile.experienceLevel || "Not specified"}
- CV: ${(profile.cvText || "Not provided").slice(0, 3000)}

Job:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- URL: ${job.url}
- Description: ${job.description}`;

  const raw = await analyzeText(prompt, payload);
  try {
    const parsed = JSON.parse(extractJson(raw)) as Partial<JobAIInsights>;
    return {
      relevanceScore: clampScore(parsed.relevanceScore),
      aiSummary: (parsed.aiSummary || "").toString().slice(0, 300),
      companyInsights: (parsed.companyInsights || "").toString().slice(0, 400),
      requiredSkills: Array.isArray(parsed.requiredSkills)
        ? parsed.requiredSkills.map(String).slice(0, 20)
        : [],
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).slice(0, 20) : [],
    };
  } catch {
    return {
      relevanceScore: 0,
      aiSummary: "",
      companyInsights: "",
      requiredSkills: [],
      tags: [],
    };
  }
}
