import { NextRequest, NextResponse } from 'next/server';
import { scrapeJobPage } from '@/server/services/scraper';
import { generateStructuredResponse } from '@/server/ai/gemini';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const jobText = await scrapeJobPage(url);

    const prompt = `
      You are an expert recruitment assistant. 
      Extract the following details from this job posting text:
      - title (Job Title)
      - company (Company Name)
      - location (City, State/Country)
      - responsibilities (A list of 3-5 key responsibilities)
      - skills (A list of 5-8 required skills)
      - description (A short 2-sentence summary of the role)

      Return a valid JSON object matching these keys.
      
      Job Text:
      ${jobText}
    `;

    const jobData = await generateStructuredResponse<any>(prompt);

    return NextResponse.json(jobData);
  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json({ error: 'Failed to extract job details' }, { status: 500 });
  }
}
