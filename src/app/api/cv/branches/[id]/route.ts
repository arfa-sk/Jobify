import { NextRequest, NextResponse } from 'next/server';
import CV from '@/server/models/CV';
import connectDB from '@/server/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId') || '000000000000000000000001';
        const { id } = await params;

        const cv = await CV.findOne({ _id: id, userId });
        if (!cv) return NextResponse.json({ error: 'CV not found' }, { status: 404 });
        
        return NextResponse.json({ cv });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
