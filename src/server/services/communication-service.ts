import { generateStructuredResponse } from '@/server/ai/gemini';
import { JsonResumeSchema } from '@/types/cv';

export interface CoverLetterResponse {
  content: string;
  emailSubject: string;
  emailBody: string;
}

export async function generateCommunication(
  type: 'cover-letter' | 'networking-email',
  cvJson: JsonResumeSchema,
  jobDescription: string,
  targetRole?: string
): Promise<string | CoverLetterResponse> {
  const isCoverLetter = type === 'cover-letter';
  
  // 1. Pass 1: Strategic Draft
  const draftPrompt = `
Act as a professional career consultant. Generate a ${type === 'cover-letter' ? 'Strategic Cover Letter' : 'Networking Outreach Email'}.

Context:
- Target Role: ${targetRole || 'Professional Role'}
- Job Description: ${jobDescription.substring(0, 2000)}
- Candidate Resume: ${JSON.stringify(cvJson)}

Requirements:
- Concise: Max 250 words.
- Fact-Strict: Only use experience present in the resume.
- Persuasive: Link specific achievements to the job requirements.
- Formatting: No markdown, no emojis. Use clear paragraphs.

Return JSON: { "draft": "..." }
`.trim();

  const draftResult = await generateStructuredResponse<{ draft: string }>(draftPrompt);
  let finalContent = draftResult.draft;

  // 2. Pass 2: Humanization Pass (Elite Quality)
  const humanizePrompt = `
You are a professional editor. Rewrite the following ${type} to sound naturally human, sincere, and compelling.

Rules:
- Remove AI clichés (e.g., "I am writing to express my interest", "a perfect fit", "highly motivated").
- Vary sentence length and rhythm.
- Maintain professional tone but avoid robotic structure.
- Do NOT change any facts or achievements.
- Keep it under 250 words.

Original Draft:
${draftResult.draft}

Return ONLY the rewritten text.
`.trim();

  try {
    // We use a simpler call for the final text to avoid JSON overhead if not needed,
    // but for consistency with our existing patterns, we'll keep it structured or just use the draft if it's already good.
    const humanizedResult = await generateStructuredResponse<{ finalContent: string }>(
      `Humanize instructions:\n${humanizePrompt}\n\nReturn JSON: { "finalContent": "..." }`
    );
    finalContent = humanizedResult.finalContent;
  } catch (err) {
    console.warn("Humanization pass failed, falling back to draft.", err);
  }

  if (isCoverLetter) {
    return {
      content: finalContent,
      emailSubject: `Application for ${targetRole || 'the open position'} - ${cvJson.basics?.name || 'Applicant'}`,
      emailBody: `Dear Hiring Team,\n\nPlease find my application for the ${targetRole || 'position'} attached.\n\nBest regards,\n${cvJson.basics?.name || 'Applicant'}`
    };
  }

  return finalContent;
}
