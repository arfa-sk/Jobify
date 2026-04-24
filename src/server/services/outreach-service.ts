import { analyzeText } from "@/server/ai/gemini";
import { JsonResumeSchema } from "@/types/cv";

export interface OutreachResult {
  coverLetter: string;
  outreachEmail: string;
}

export async function generateOutreach(
  cvJson: JsonResumeSchema,
  jobDescription: string,
  targetRole?: string
): Promise<OutreachResult> {
  const prompt = `
Generate a professional, high-impact Cover Letter and a concise Networking Email for this role.

**Target Role:** ${targetRole || 'Potential Opportunity'}
**Job Description:**
${jobDescription.substring(0, 2000)}

**Candidate Profile:**
${cvJson.basics?.summary || 'Experienced professional'}
Key Skills: ${cvJson.skills?.map(s => s.name).join(', ') || 'Various technical skills'}

**RULES:**
1. Cover Letter: Professional, 3-4 paragraphs, focused on JD keywords.
2. Networking Email: 2-3 short paragraphs, punchy, call to action.
3. Tone: Confident, competent, but humble.
4. Language: Match the Job Description language.
5. Use [BRACKETS] for any missing info like Date or Recipient Name.

Return exactly in this format:
====COVER LETTER====
[Letter content here]
====NETWORKING EMAIL====
[Email content here]
`.trim();

  const response = await analyzeText(prompt, "Generate outreach materials.");
  
  const [clPart, emailPart] = response.split("====NETWORKING EMAIL====");
  const coverLetter = clPart.replace("====COVER LETTER====", "").trim();
  const outreachEmail = (emailPart || "").trim();

  return { coverLetter, outreachEmail };
}
