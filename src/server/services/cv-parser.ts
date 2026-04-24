import { JsonResumeSchema } from '@/types/cv';
import { generateContentWithFile } from '@/server/ai/gemini';
import fs from 'fs';
import path from 'path';

const STRICT_FREEFORM_PROMPT = `
You are a CV transcription tool. Your ONLY job is to read the attached CV file and return a FREEFORM JSON representation that mirrors the CV exactly.

=== NON-NEGOTIABLE RULES ===
- Do NOT use or force any predefined schema (do NOT force JSON Resume fields like basics/work/education unless those exact headings exist in the source).
- Preserve section order exactly as in the source CV.
- Preserve text exactly as written, including punctuation, casing, and wording.
- Do NOT normalize dates, names, locations, or formatting words.
- Do NOT infer, synthesize, reword, summarize, or clean up content.
- Do NOT merge/split bullets except where the source clearly defines bullet boundaries.
- Do NOT omit sections. If a section exists, include it.
- Ignore running headers/footers/page markers that repeat across pages.

=== STRICT FIELD NAME CONTRACT ===
Within ALL array entries you MUST use exactly these field names:
- "title" for the main label (job title, degree name, certificate name, category name)
- "subtitle" for the secondary label (company, institution, organization, school, employer)
- "dates" for date or period information (e.g. "01/2020 – 12/2023")
- "bullets" for bullet point arrays (lists of responsibilities, achievements, tasks)
- "content" for key-value content text (e.g. skill values, language proficiency levels, descriptions)
- "category" for category labels in skill/language/knowledge sections

DO NOT use synonyms. Only the six field names above.

=== STRUCTURE INSTRUCTIONS ===
- Return one top-level JSON object.
- Use section headings from the CV as keys whenever possible.
- If the first unlabeled block is personal/contact info, keep it under "Header Info".
- NEVER include leading bullet characters (•, -, –) in stored strings. Strip them.

Return ONLY a single valid JSON object enclosed in triple backticks (\`\`\`json ... \`\`\`).
`;

/**
 * Normalizes field names that slipped through the parsing prompt.
 */
const FIELD_ALIAS_MAP: Record<string, string> = {
    degree: 'title',
    role: 'title',
    position: 'title',
    institution: 'subtitle',
    company: 'subtitle',
    employer: 'subtitle',
    school: 'subtitle',
    organization: 'subtitle',
    period: 'dates',
    duration: 'dates',
    date: 'dates',
    description: 'bullets',
    responsibilities: 'bullets',
    achievements: 'bullets',
    highlights: 'bullets',
    details: 'bullets',
};

/**
 * Maps non-standard section names to canonical JSON Resume section names.
 */
const SECTION_NAME_MAP: Record<string, string> = {
    'Header Info': 'basics',
    'HEADER': 'basics',
    'CONTACT': 'basics',
    'PROFILE': 'summary',
    'EXPERIENCE': 'work',
    'WORK HISTORY': 'work',
    'EMPLOYMENT': 'work',
    'EDUCATION': 'education',
    'SKILLS': 'skills',
    'TECHNICAL SKILLS': 'skills',
    'LANGUAGES': 'languages',
    'CERTIFICATIONS': 'certificates',
    'PROJECTS': 'projects',
    'INTERESTS': 'interests',
    'AWARDS': 'awards',
};

export async function parseUploadedCv(
    filePath: string,
    mimeType: string,
    userId: string
): Promise<JsonResumeSchema> {
    console.log(`Parsing CV for user ${userId}...`);

    const result = await generateContentWithFile(STRICT_FREEFORM_PROMPT, filePath, mimeType);
    const text = result.text;

    // Extract JSON from markdown fences
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = text.match(jsonRegex);
    if (!match || !match[1]) {
        throw new Error('AI failed to return valid JSON');
    }

    const rawJson = JSON.parse(match[1].trim());
    return normalizeCvJson(rawJson);
}

function normalizeCvJson(rawJson: Record<string, any>): JsonResumeSchema {
    const normalized: any = {};

    for (const [key, value] of Object.entries(rawJson)) {
        // Map section names
        const canonicalSection = SECTION_NAME_MAP[key.toUpperCase()] || SECTION_NAME_MAP[key] || key;
        
        if (Array.isArray(value)) {
            normalized[canonicalSection] = value.map(entry => {
                if (typeof entry === 'object' && entry !== null) {
                    const normalizedEntry: any = {};
                    for (const [fKey, fValue] of Object.entries(entry)) {
                        const canonicalField = FIELD_ALIAS_MAP[fKey] || fKey;
                        normalizedEntry[canonicalField] = fValue;
                    }
                    return normalizedEntry;
                }
                return entry;
            });
        } else {
            normalized[canonicalSection] = value;
        }
    }

    return normalized as JsonResumeSchema;
}
