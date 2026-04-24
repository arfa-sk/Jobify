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
            console.error("[Tailor Route] Validation Failed:", { cvId, userId, hasJD: !!jobDescription });
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Quick cast check to prevent 500s on bad IDs
        if (typeof cvId === 'string' && !/^[0-9a-fA-F]{24}$/.test(cvId)) {
            return NextResponse.json({ error: 'Invalid CV ID format' }, { status: 400 });
        }

        const baseCv = await CV.findOne({ _id: cvId, userId: userId || '000000000000000000000001' });
        if (!baseCv) {
            console.error("[Tailor Route] CV not found for query:", { cvId, userId });
            return NextResponse.json({ error: 'Base CV not found' }, { status: 404 });
        }

        // Sanitize cvJson before tailoring
        if (baseCv.cvJson) {
          if (!baseCv.cvJson.basics) baseCv.cvJson.basics = {};
          if (!baseCv.cvJson.basics.summary && (baseCv.cvJson.summary || baseCv.cvJson.SUMMARY)) {
            baseCv.cvJson.basics.summary = baseCv.cvJson.summary || baseCv.cvJson.SUMMARY;
          }
        }

        const result = await runTailoringPipeline(baseCv.cvJson, jobDescription, targetRole);

        // Create new branch
        const newBranch = await CV.create({
            userId: baseCv.userId,
            displayName: `${targetRole || result.jdAnalysis.detectedArchetype} Branch`,
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
            changes: result.changes
        });
    } catch (error: any) {
        console.error("[Tailor Route Error]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
