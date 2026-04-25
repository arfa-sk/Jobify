import { NextRequest, NextResponse } from 'next/server';
import { runTailoringPipeline } from '@/server/services/cv-tailoring-service';
import CV from '@/models/CV';
import { Application } from '@/models/Application';
import connectToDatabase from '@/lib/mongodb';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const { userId, cvId, jobId, jobDescription, targetRole } = body;
        
        console.log(`[Tailor Suite] Starting OPTIMIZED single-call generation for User: ${userId}`);

        if (!cvId || !userId || !jobDescription) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Get Base CV
        const baseCv = await CV.findOne({ _id: cvId, userId: userId || '000000000000000000000001' });
        if (!baseCv) return NextResponse.json({ error: 'Base CV not found' }, { status: 404 });

        // 2. Run Single-Call Optimized Pipeline (Analysis + Tailoring + Outreach)
        const result = await runTailoringPipeline(baseCv.cvJson, jobDescription, { 
            targetRole, 
            includeOutreach: true 
        });

        if (!result.outreach) {
            throw new Error("Outreach generation failed in single-call pipeline");
        }

        // 3. Create new CV branch
        const newBranch = await CV.create({
            userId: baseCv.userId,
            displayName: `${targetRole || result.jdAnalysis.detectedArchetype} Suite`,
            category: targetRole || result.jdAnalysis.detectedArchetype,
            cvJson: result.tailoredCv,
            isDefault: false,
            isTailored: true,
            targetRole: targetRole || result.jdAnalysis.detectedArchetype,
            parentCvId: baseCv._id
        });

        // 4. Create Application record
        const application = await Application.create({
            userId: baseCv.userId,
            jobId,
            cvId: newBranch._id,
            coverLetter: result.outreach.coverLetter,
            outreachEmail: result.outreach.outreachEmail,
            status: 'APPLIED',
            appliedAt: new Date()
        });

        return NextResponse.json({ 
            success: true, 
            branchId: newBranch._id,
            applicationId: application._id,
            outreach: result.outreach,
            analysis: result.jdAnalysis
        });

    } catch (error: any) {
        console.error("[Tailor Suite Error]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
