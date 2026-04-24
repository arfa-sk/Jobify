import { NextRequest, NextResponse } from 'next/server';
import { performFullAnalysis, getSectionAnalysis, generateCvHash } from '@/server/services/analysis-service';
import CV from '@/models/CV';
import CvAnalysis from '@/models/CvAnalysis';
import connectToDatabase from '@/lib/mongodb';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const { userId, cvId, type } = body;

        const cv = await CV.findOne({ _id: cvId, userId: userId || 'default-user' });
        if (!cv || !cv.cvJson) {
            return NextResponse.json({ error: 'CV not found or empty' }, { status: 404 });
        }

        if (type === 'full') {
            const currentHash = generateCvHash(cv.cvJson);
            
            // Check for existing completed analysis with same hash
            const existingAnalysis = await CvAnalysis.findOne({
                cvId: cv._id,
                cvHash: currentHash,
                status: 'completed'
            }).sort({ analysisDate: -1 });

            if (existingAnalysis) {
                console.log('Using cached analysis for hash:', currentHash);
                return NextResponse.json({ analysis: existingAnalysis });
            }

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
