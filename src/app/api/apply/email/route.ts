import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db';
import Job from '@/models/Job';
import CV from '@/models/CV';
import { generateCoverLetter } from '@/server/services/apply-ai-service';
import { ensurePublic } from '@/server/services/share-service';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { jobId, cvId, userId, mode } = await req.json();

        if (!jobId || !cvId || !userId || !mode) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch Job
        const job = await Job.findById(jobId);
        if (!job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        // 2. Fetch CV
        const cv = await CV.findOne({ _id: cvId, userId });
        if (!cv) {
            return NextResponse.json({ error: 'CV not found' }, { status: 404 });
        }

        // 3. Generate AI Cover Letter
        const coverLetter = await generateCoverLetter(job, cv, mode);

        // 4. Ensure CV is public and get link
        const { url: cvLink } = await ensurePublic(cvId, userId);

        // 5. Build Gmail Link
        // Format: https://mail.google.com/mail/?view=cm&fs=1&to=...&su=...&body=...
        const subject = encodeURIComponent(`Job Application: ${job.title} - ${cv.displayName}`);
        const bodyWithLink = `${coverLetter}\n\n---\nYou can view my full interactive profile here: ${cvLink}`;
        const encodedBody = encodeURIComponent(bodyWithLink);

        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(job.email)}&su=${subject}&body=${encodedBody}`;

        // 6. Update Job Status (using targeted update to bypass validation issues)
        await Job.updateOne({ _id: jobId }, { $set: { status: 'applied' } });

        return NextResponse.json({
            success: true,
            subject: `Job Application: ${job.title}`,
            body: bodyWithLink,
            gmailUrl
        });

    } catch (error: any) {
        console.error('Apply API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
