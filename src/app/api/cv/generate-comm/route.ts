import { NextRequest, NextResponse } from 'next/server';
import { generateCommunication } from '@/server/services/communication-service';
import connectToDatabase from '@/lib/mongodb';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const { type, cvJson, jobDescription, targetRole } = await req.json();

        if (!cvJson || !jobDescription) {
            return NextResponse.json({ error: 'CV and Job Description are required' }, { status: 400 });
        }

        const content = await generateCommunication(type, cvJson, jobDescription, targetRole);
        return NextResponse.json({ content });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
