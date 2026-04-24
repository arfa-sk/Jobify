import type { ParsedJob } from "./parser";
import { Job, IJob } from "@/models/Job";

export interface SaveResult {
  saved: number;
  failed: number;
  jobs: Partial<IJob>[];
}

export async function saveJobs(jobs: ParsedJob[]): Promise<SaveResult> {
  if (jobs.length === 0) return { saved: 0, failed: 0, jobs: [] };

  const result: SaveResult = { saved: 0, failed: 0, jobs: [] };

  // Bulk upsert: insertMany with ordered:false ignores duplicate key errors
  try {
    const docs = jobs.map((j) => ({
      title: j.title,
      company: j.company,
      location: j.location,
      description: j.description,
      url: j.url,
      source: j.source,
      postedAt: j.postedAt,
      fetchedAt: new Date(),
      guid: j.guid,
      aiSummary: (j as ParsedJob & { aiSummary?: string }).aiSummary,
      tags: (j as ParsedJob & { tags?: string[] }).tags,
      relevanceScore: (j as ParsedJob & { relevanceScore?: number }).relevanceScore,
      companyInsights: (j as ParsedJob & { companyInsights?: string }).companyInsights,
      requiredSkills: (j as ParsedJob & { requiredSkills?: string[] }).requiredSkills,
    }));

    const inserted = await Job.insertMany(docs, {
      ordered: false,
      // Skip duplicates silently
    });

    result.saved = inserted.length;
    result.jobs = inserted.map((d) => ({
      _id: d._id,
      title: d.title,
      company: d.company,
      location: d.location,
      url: d.url,
      source: d.source,
      postedAt: d.postedAt,
      relevanceScore: d.relevanceScore,
      requiredSkills: d.requiredSkills,
    }));
  } catch (err: unknown) {
    // insertMany with ordered:false throws BulkWriteError but still inserts valid docs
    if (
      err &&
      typeof err === "object" &&
      "insertedDocs" in err
    ) {
      const bulkErr = err as { insertedDocs: IJob[] };
      result.saved = bulkErr.insertedDocs.length;
      result.jobs = bulkErr.insertedDocs.map((d) => ({
        _id: d._id,
        title: d.title,
        company: d.company,
        url: d.url,
        relevanceScore: d.relevanceScore,
      }));
    } else {
      console.error("[Saver] Unexpected error:", err);
      result.failed++;
    }
  }

  console.log(`[Saver] Saved ${result.saved} jobs`);
  return result;
}
