import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { fetchAllFeeds } from "@/server/pipeline/fetcher";
import { parseAllFeeds } from "@/server/pipeline/parser";
import { deduplicateJobs } from "@/server/pipeline/deduper";
import { saveJobs } from "@/server/pipeline/saver";
import { analyzeJobFit, CandidateProfile } from "@/server/ai/analyzer";
import type { ParsedJob } from "@/server/pipeline/parser";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function matchesProfile(job: ParsedJob, profile: CandidateProfile): boolean {
  const haystack =
    `${job.title} ${job.description} ${job.location} ${job.company}`.toLowerCase();

  const roleOk = profile.desiredRole
    ? haystack.includes(profile.desiredRole.toLowerCase())
    : true;
  const locationOk = profile.desiredLocation
    ? haystack.includes(profile.desiredLocation.toLowerCase())
    : true;
  const experienceOk = profile.experienceLevel
    ? haystack.includes(profile.experienceLevel.toLowerCase())
    : true;

  return roleOk && locationOk && experienceOk;
}

export async function POST(req: NextRequest) {
  // Auth via CRON_SECRET header (optional but recommended)
  const secret = req.headers.get("x-cron-secret");
  if (
    process.env.CRON_SECRET &&
    secret !== process.env.CRON_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const profile: CandidateProfile = {
      desiredRole: body?.desiredRole,
      desiredLocation: body?.desiredLocation,
      experienceLevel: body?.experienceLevel,
      cvText: body?.cvText,
    };

    // 1. Connect DB
    await connectDB();
    console.log("[Pipeline] DB connected");

    // 2. Fetch RSS feeds
    const feeds = await fetchAllFeeds();
    console.log(`[Pipeline] Fetched ${feeds.length} feeds`);

    if (feeds.length === 0) {
      return NextResponse.json(
        { error: "No feeds could be fetched. Check your network." },
        { status: 502 }
      );
    }

    // 3. Parse feeds into job objects
    const parsedJobs = await parseAllFeeds(feeds);
    console.log(`[Pipeline] Parsed ${parsedJobs.length} total jobs`);

    // 4. Deduplicate
    const newJobs = await deduplicateJobs(parsedJobs);

    // 5. Filter for candidate profile if provided
    const filteredJobs =
      profile.desiredRole || profile.desiredLocation || profile.experienceLevel
        ? newJobs.filter((job) => matchesProfile(job, profile))
        : newJobs;

    // 6. AI enrichment
    let aiDemo: string | null = null;
    const enrichedJobs = [...filteredJobs];
    if (process.env.GEMINI_API_KEY && enrichedJobs.length > 0) {
      const aiLimit = Math.min(enrichedJobs.length, 20);
      for (let i = 0; i < aiLimit; i++) {
        const insights = await analyzeJobFit(enrichedJobs[i], profile);
        (enrichedJobs[i] as ParsedJob & { aiSummary?: string }).aiSummary = insights.aiSummary;
        (enrichedJobs[i] as ParsedJob & { tags?: string[] }).tags = insights.tags;
        (enrichedJobs[i] as ParsedJob & { relevanceScore?: number }).relevanceScore =
          insights.relevanceScore;
        (enrichedJobs[i] as ParsedJob & { companyInsights?: string }).companyInsights =
          insights.companyInsights;
        (enrichedJobs[i] as ParsedJob & { requiredSkills?: string[] }).requiredSkills =
          insights.requiredSkills;

        if (i === 0) aiDemo = insights.aiSummary || null;
      }
    }

    // 7. Save to DB
    const saveResult = await saveJobs(enrichedJobs);

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      stats: {
        feedsFetched: feeds.length,
        totalParsed: parsedJobs.length,
        duplicatesRemoved: parsedJobs.length - newJobs.length,
        profileFilteredOut: newJobs.length - filteredJobs.length,
        newJobsSaved: saveResult.saved,
        durationMs: duration,
      },
      aiDemo: aiDemo || undefined,
      sample: saveResult.jobs.slice(0, 5),
    });
  } catch (err: unknown) {
    console.error("[Pipeline] Fatal error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Pipeline failed", details: message },
      { status: 500 }
    );
  }
}
