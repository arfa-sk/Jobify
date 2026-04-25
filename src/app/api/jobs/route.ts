import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Job } from "@/models/Job";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const q = (searchParams.get("q") || "").trim();
    const location = (searchParams.get("location") || "").trim();
    const minScoreRaw = searchParams.get("minScore");
    const limit = Math.min(Number(searchParams.get("limit") || 20), 100);
    const skip = Math.max(Number(searchParams.get("skip") || 0), 0);

    const uoid = userId ? new Types.ObjectId(userId) : null;
    const filter: Record<string, unknown> = {};
    
    // If userId provided, only show their targeted jobs
    if (uoid) {
      filter.userId = uoid;
    } else {
      // If no userId, only show global discovery jobs
      filter.userId = { $exists: false };
    }

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { company: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }
    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }
    if (minScoreRaw !== null && minScoreRaw !== "") {
      const minScore = Number(minScoreRaw);
      if (!Number.isNaN(minScore)) {
        filter.relevanceScore = { $gte: minScore };
      }
    }

    let items = await Job.find(filter)
      .sort({ relevanceScore: -1, postedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Job.countDocuments(filter);

    // Auto-seed for demo if empty for a specific user
    if (uoid && items.length === 0) {
        const sampleJobs = [
            {
                userId: uoid,
                title: 'Senior Frontend Engineer',
                company: 'Vercel',
                email: 'careers@vercel.com',
                description: 'We are looking for a React expert to help us build the future of the web. Experience with Next.js and Tailwind is a must.',
                location: 'Remote',
                status: 'open'
            },
            {
                userId: uoid,
                title: 'Full Stack Developer',
                company: 'Supabase',
                email: 'hiring@supabase.io',
                description: 'Join the team building the open source Firebase alternative. Work with Postgres, Go, and TypeScript.',
                location: 'Singapore / Remote',
                status: 'open'
            }
        ];
        await Job.insertMany(sampleJobs);
        items = await Job.find({ userId: uoid }).lean();
    }

    return NextResponse.json({
      success: true,
      pagination: { total, skip, limit, count: items.length },
      jobs: items,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const data = await req.json();
        const job = await Job.create(data);
        return NextResponse.json({ success: true, job });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
