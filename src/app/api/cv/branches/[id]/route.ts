import { NextRequest, NextResponse } from 'next/server';
import CV from '@/models/CV';
import connectToDatabase from '@/lib/mongodb';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId') || '000000000000000000000001';
        const { id } = await params;

        const cv = await CV.findOne({ _id: id, userId });
        if (!cv) return NextResponse.json({ error: 'CV not found' }, { status: 404 });
        
        if (cv && cv.cvJson) {
      // Auto-repair parsing gaps for existing data
      const json = cv.cvJson;
      if (!json.basics) json.basics = {};
      
      // If summary is at top level or in wrong casing, move it to basics.summary
      if (!json.basics.summary && (json.summary || json.SUMMARY || json.Profile || json.PROFILE)) {
        json.basics.summary = json.summary || json.SUMMARY || json.Profile || json.PROFILE;
      }

      // Ensure basics fields are populated from top-level slips
      if (!json.basics.name && json.Name) json.basics.name = json.Name;
      if (!json.basics.email && json.Email) json.basics.email = json.Email;

      cv.cvJson = json;
    }

    return NextResponse.json({ cv });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
