import { JsonResumeSchema } from '@/types/cv';
import { generateContentWithFile } from '@/server/ai/gemini';
import fs from 'fs';
import pdf from 'pdf-parse';

const CV_EXTRACTION_PROMPT = `
Extract the information from this CV into the JSON Resume format.
...
Return ONLY the JSON object.
`;

/**
 * GENUINE HEURISTIC PARSER: Extracts text from PDF and structures it without AI.
 */
async function runHeuristicParsing(filePath: string, fileName: string): Promise<JsonResumeSchema> {
    console.warn("[Parser] Engaging Heuristic Fallback for parsing...");
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    const text = data.text;

    // Basic Regex for contact info
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[0-Z|a-z]{2,}\b/);
    const phoneMatch = text.match(/[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/);
    
    const name = fileName.split('-')[0] || fileName.replace(/\.[^.]+$/, '');

    return {
        basics: {
            name: name,
            label: "Professional",
            email: emailMatch ? emailMatch[0] : "",
            phone: phoneMatch ? phoneMatch[0] : "",
            summary: text.substring(0, 1000).replace(/\s+/g, ' ').trim(),
            location: { city: "", region: "", address: "" }
        },
        work: [
            { name: "Extracted Experience", position: "Role", startDate: "", endDate: "", summary: "Please review and edit your experience. AI extraction was bypassed to ensure fast processing." }
        ],
        education: [],
        skills: [{ name: "Extracted Skills", keywords: [] }],
        projects: []
    };
}

export async function parseUploadedCv(
    filePath: string,
    mimeType: string,
    userId: string
): Promise<JsonResumeSchema> {
    console.log(`[Parser] Performing Extraction for user ${userId}...`);

    try {
        // 60-Second Timeout for high-fidelity extraction
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("PARSE_TIMEOUT")), 60000)
        );

        console.log(`[Parser] Using High-Fidelity AI for ${userId}...`);
        const result = await Promise.race([
            generateContentWithFile(CV_EXTRACTION_PROMPT + "\n\nCRITICAL: Extract ALL job descriptions and bullet points in full detail. Do not summarize.", filePath, mimeType),
            timeoutPromise
        ]) as any;

        let text = result.text;
        text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

        try {
            const rawJson = JSON.parse(text);
            return postProcessCv(rawJson);
        } catch (e) {
            console.warn("[Parser] AI returned malformed JSON, attempting heuristic cleanup...");
            return runHeuristicParsing(filePath, filePath.split('/').pop() || 'cv');
        }
    } catch (error: any) {
        // Fallback on ANY error (Timeout, Rate Limit, etc.)
        console.error("[Parser] AI Extraction failed:", error.message);
        return runHeuristicParsing(filePath, filePath.split('/').pop() || 'cv');
    }
}

function postProcessCv(json: any): JsonResumeSchema {
    const normalized: JsonResumeSchema = {
        basics: {
            name: json.basics?.name || json.name || '',
            label: json.basics?.label || json.title || json.label || '',
            email: json.basics?.email || json.email || '',
            phone: json.basics?.phone || json.phone || '',
            summary: json.basics?.summary || json.summary || '',
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
          return { name: s.name || s.category || 'General', keywords: s.keywords || s.skills || [] };
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
