import type { ParsedJob } from "./parser";
import { Job } from "@/models/Job";

/**
 * Given a list of parsed jobs, returns only the ones
 * whose guid does NOT already exist in the database.
 */
export async function deduplicateJobs(jobs: ParsedJob[]): Promise<ParsedJob[]> {
  if (jobs.length === 0) return [];

  const guids = jobs.map((j) => j.guid);

  // Find all guids that already exist
  const existing = await Job.find({ guid: { $in: guids } })
    .select("guid")
    .lean();

  const existingSet = new Set(existing.map((e) => e.guid));

  // Also deduplicate within the batch itself (same guid from multiple feeds)
  const seen = new Set<string>();
  const newJobs: ParsedJob[] = [];

  for (const job of jobs) {
    if (!existingSet.has(job.guid) && !seen.has(job.guid)) {
      seen.add(job.guid);
      newJobs.push(job);
    }
  }

  console.log(
    `[Deduper] ${jobs.length} total -> ${newJobs.length} new (${jobs.length - newJobs.length} duplicates removed)`
  );

  return newJobs;
}
