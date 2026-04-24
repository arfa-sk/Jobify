import { JsonResumeSchema } from '@/types/cv';
import { generateContentWithFile } from '@/server/ai/gemini';

const CV_EXTRACTION_PROMPT = `
Extract the information from this CV into the JSON Resume format.

**STRICT RULES:**
1.  **Basics Section**: Name, Title, Email, Phone, Location. Map "Profile/Summary/About" to \`basics.summary\`.
2.  **Work Section**: Map ALL work history to \`work\`. Include \`name\`, \`position\`, \`startDate\`, \`endDate\`, \`summary\`.
3.  **Education Section**: Map ALL schooling to \`education\`.
4.  **Skills Section**: Group skills by category (e.g. Technical, Soft, Tools).
5.  **Projects Section**: Map personal/pro projects to \`projects\`. Include \`name\`, \`description\`, \`highlights\` (array), \`url\`.
6.  **Certificates Section**: Map all certs to \`certificates\`. Include \`name\`, \`issuer\`, \`date\`.
7.  **Languages Section**: Map all languages to \`languages\`. Include \`language\`, \`fluency\`.
8.  **Awards Section**: Map awards/honors to \`awards\`.
9.  **Publications Section**: Map any publications to \`publications\`.
10. **Interests Section**: Map hobbies/interests to \`interests\`.

**Cleanliness**: Remove all bullet characters. Ensure no fields are left empty if the data exists.

Return ONLY the JSON object.
`;

export async function parseUploadedCv(
    filePath: string,
    mimeType: string,
    userId: string
): Promise<JsonResumeSchema> {
    console.log(`Performing TOTAL Extraction for user ${userId}...`);

    const result = await generateContentWithFile(CV_EXTRACTION_PROMPT, filePath, mimeType);
    let text = result.text;
    text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    try {
        const rawJson = JSON.parse(text);
        return postProcessCv(rawJson);
    } catch (e) {
        console.error("JSON Parse Error. Attempting regex extract.");
        const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
        const match = text.match(jsonRegex);
        if (match && match[1]) {
            return postProcessCv(JSON.parse(match[1].trim()));
        }
        throw new Error("Failed to parse AI response into JSON");
    }
}

function postProcessCv(json: any): JsonResumeSchema {
    const normalized: JsonResumeSchema = {
        basics: {
            name: json.basics?.name || json.name || '',
            label: json.basics?.label || json.title || json.label || '',
            email: json.basics?.email || json.email || '',
            phone: json.basics?.phone || json.phone || '',
            summary: json.basics?.summary || json.summary || json.SUMMARY || json.Profile || json.PROFILE || '',
            location: {
                address: json.basics?.location?.address || '',
                city: json.basics?.location?.city || '',
                region: json.basics?.location?.region || '',
            }
        },
        work: (json.work || []).map((w: any) => ({
            name: w.name || w.company || '',
            position: w.position || w.title || '',
            startDate: w.startDate || w.date || '',
            endDate: w.endDate || '',
            summary: w.summary || (Array.isArray(w.bullets) ? w.bullets.join('\n') : w.highlights?.join('\n')) || '',
        })),
        education: (json.education || []).map((e: any) => ({
            institution: e.institution || e.school || '',
            area: e.area || e.field || '',
            studyType: e.studyType || e.degree || '',
            endDate: e.endDate || '',
        })),
        skills: (json.skills || []).map((s: any) => {
          if (typeof s === 'string') return { name: s, keywords: [] };
          return {
            name: s.name || s.category || 'General',
            keywords: s.keywords || s.skills || []
          };
        }),
        projects: (json.projects || []).map((p: any) => ({
            name: p.name || p.title || '',
            description: p.description || p.summary || '',
            highlights: p.highlights || p.bullets || [],
            url: p.url || p.link || '',
        })),
        certificates: (json.certificates || json.certifications || []).map((c: any) => ({
            name: c.name || c.title || '',
            issuer: c.issuer || c.authority || '',
            date: c.date || c.issuedAt || '',
        })),
        languages: (json.languages || []).map((l: any) => ({
            language: l.language || l.name || '',
            fluency: l.fluency || l.level || '',
        })),
        awards: json.awards || [],
        publications: json.publications || [],
        interests: json.interests || [],
    };

    return normalized;
}
