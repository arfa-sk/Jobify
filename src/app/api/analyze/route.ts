import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Job } from "@/models/Job";
import { analyzeJobFit, CandidateProfile } from "@/server/ai/analyzer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));

    const profile: CandidateProfile = {
      desiredRole: body?.desiredRole,
      desiredLocation: body?.desiredLocation,
      experienceLevel: body?.experienceLevel,
      cvText: body?.cvText,
    };

    const jobId = (body?.jobId || "").toString().trim();
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json(
        { success: false, error: "Valid jobId is required" },
        { status: 400 }
      );
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    const insights = await analyzeJobFit(
      {
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        url: job.url,
      },
      profile
    );

    job.aiSummary = insights.aiSummary;
    job.relevanceScore = insights.relevanceScore;
    job.companyInsights = insights.companyInsights;
    job.requiredSkills = insights.requiredSkills;
    job.tags = insights.tags;
    await job.save();

    return NextResponse.json({
      success: true,
      jobId: job._id,
      insights,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
