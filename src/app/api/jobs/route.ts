import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Job } from "@/models/Job";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const location = (searchParams.get("location") || "").trim();
    const minScoreRaw = searchParams.get("minScore");
    const limit = Math.min(Number(searchParams.get("limit") || 20), 100);
    const skip = Math.max(Number(searchParams.get("skip") || 0), 0);

    const filter: Record<string, unknown> = {};
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

    const [items, total] = await Promise.all([
      Job.find(filter)
        .sort({ relevanceScore: -1, postedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Job.countDocuments(filter),
    ]);

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
