import { NextRequest, NextResponse } from 'next/server';
import { runTailoringPipeline } from '@/server/services/cv-tailoring-service';
import CV from '@/models/CV';
import connectToDatabase from '@/lib/mongodb';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const { userId, cvId, jobDescription, targetRole } = body;
        
        console.log(`[Tailor Route] Request - CV: ${cvId}, User: ${userId}`);

        if (!cvId || !userId || !jobDescription) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const baseCv = await CV.findOne({ _id: cvId, userId: userId || '000000000000000000000001' });
        if (!baseCv) return NextResponse.json({ error: 'Base CV not found' }, { status: 404 });

        // Use optimized pipeline
        const result = await runTailoringPipeline(baseCv.cvJson, jobDescription, { targetRole });

        // Create new branch
        const newBranch = await CV.create({
            userId: baseCv.userId,
            displayName: `[TAILORED] ${targetRole || result.jdAnalysis.detectedArchetype}`,
            category: targetRole || result.jdAnalysis.detectedArchetype,
            cvJson: result.tailoredCv,
            isDefault: false,
            isTailored: true,
            targetRole: targetRole || result.jdAnalysis.detectedArchetype,
            parentCvId: baseCv._id
        });

        return NextResponse.json({ 
            success: true, 
            branchId: newBranch._id,
            jdAnalysis: result.jdAnalysis,
            changes: result.changes,
            mode: result.mode
        });
    } catch (error: any) {
        console.error("[Tailor Route Error]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
