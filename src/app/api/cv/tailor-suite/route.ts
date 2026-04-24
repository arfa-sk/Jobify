import { NextRequest, NextResponse } from 'next/server';
import { runTailoringPipeline } from '@/server/services/cv-tailoring-service';
import { generateOutreach } from '@/server/services/outreach-service';
import CV from '@/models/CV';
import { Application } from '@/models/Application';
import connectToDatabase from '@/lib/mongodb';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const { userId, cvId, jobId, jobDescription, targetRole } = body;
        
        console.log(`[Tailor Suite] Starting full application generation for User: ${userId}`);

        // 1. Get Base CV
        const baseCv = await CV.findOne({ _id: cvId, userId: userId || '000000000000000000000001' });
        if (!baseCv) return NextResponse.json({ error: 'Base CV not found' }, { status: 404 });

        // 2. Run Tailoring & Outreach in Parallel (or sequence for safety)
        const tailoringResult = await runTailoringPipeline(baseCv.cvJson, jobDescription, targetRole);
        const outreachResult = await generateOutreach(tailoringResult.tailoredCv, jobDescription, targetRole);

        // 3. Create new CV branch
        const newBranch = await CV.create({
            userId: baseCv.userId,
            displayName: `${targetRole || tailoringResult.jdAnalysis.detectedArchetype} Suite`,
            category: targetRole || tailoringResult.jdAnalysis.detectedArchetype,
            cvJson: tailoringResult.tailoredCv,
            isDefault: false,
            isTailored: true,
            targetRole: targetRole || tailoringResult.jdAnalysis.detectedArchetype,
            parentCvId: baseCv._id
        });

        // 4. Create Application record
        const application = await Application.create({
            userId: baseCv.userId,
            jobId,
            cvId: newBranch._id,
            coverLetter: outreachResult.coverLetter,
            outreachEmail: outreachResult.outreachEmail,
            status: 'APPLIED',
            appliedAt: new Date()
        });

        return NextResponse.json({ 
            success: true, 
            branchId: newBranch._id,
            applicationId: application._id,
            outreach: outreachResult
        });

    } catch (error: any) {
        console.error("[Tailor Suite Error]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
