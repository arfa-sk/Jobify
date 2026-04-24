import { NextRequest, NextResponse } from 'next/server';
import { performFullAnalysis, getSectionAnalysis } from '@/server/services/analysis-service';
import CV from '@/server/models/CV';
import connectDB from '@/server/db';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { userId, cvId, type } = body;

        const cv = await CV.findOne({ _id: cvId, userId: userId || 'default-user' });
        if (!cv || !cv.cvJson) {
            return NextResponse.json({ error: 'CV not found or empty' }, { status: 404 });
        }

        if (type === 'full') {
            const analysis = await performFullAnalysis(userId || 'default-user', cvId, cv.cvJson);
            return NextResponse.json({ analysis });
        }

        if (type === 'sections') {
            const sections = await getSectionAnalysis(cv.cvJson);
            return NextResponse.json({ sections });
        }

        return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
