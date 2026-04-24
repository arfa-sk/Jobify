import { NextRequest, NextResponse } from 'next/server';
import { generateRewrite } from '@/server/services/analysis-service';
import connectToDatabase from '@/lib/mongodb';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const { sectionType, currentContent, feedback } = await req.json();

        if (!currentContent || !feedback) {
            return NextResponse.json({ error: 'Content and feedback are required' }, { status: 400 });
        }

        const improvedContent = await generateRewrite(sectionType, currentContent, feedback);
        return NextResponse.json({ improvedContent });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
