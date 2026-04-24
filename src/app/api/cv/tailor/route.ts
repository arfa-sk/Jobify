import { NextRequest, NextResponse } from 'next/server';
import { runTailoringPipeline } from '@/server/services/cv-tailoring-service';
import CV from '@/models/CV';
import connectToDatabase from '@/lib/mongodb';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const { userId, cvId, jobDescription, targetRole } = await req.json();

        const baseCv = await CV.findOne({ _id: cvId, userId: userId || 'default-user' });
        if (!baseCv) return NextResponse.json({ error: 'Base CV not found' }, { status: 404 });

        const result = await runTailoringPipeline(baseCv.cvJson, jobDescription, targetRole);

        // Create new branch
        const newBranch = await CV.create({
            userId: baseCv.userId,
            displayName: `${targetRole || 'Tailored'} - ${new Date().toLocaleDateString()}`,
            category: targetRole || 'Tailored',
            cvJson: result.tailoredCv,
            isDefault: false,
            parentCvId: baseCv._id
        });

        return NextResponse.json({ 
            success: true, 
            branchId: newBranch._id,
            jdAnalysis: result.jdAnalysis,
            changes: result.changes
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
