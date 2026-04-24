import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Application } from "@/models/Application";
import { Job } from "@/models/Job";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || '000000000000000000000001';

    const applications = await Application.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with job data
    const enriched = await Promise.all(applications.map(async (app) => {
        const job = await Job.findById(app.jobId).select('title company location').lean();
        return {
            ...app,
            jobTitle: job?.title || 'Unknown Role',
            company: job?.company || 'Unknown Company',
            location: job?.location || 'Remote'
        };
    }));

    return NextResponse.json({ success: true, applications: enriched });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { userId, jobId, cvId, coverLetter, outreachEmail, status } = body;

    const application = await Application.create({
      userId: userId || '000000000000000000000001',
      jobId,
      cvId,
      coverLetter,
      outreachEmail,
      status: status || 'APPLIED',
      appliedAt: new Date()
    });

    return NextResponse.json({ success: true, application });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
