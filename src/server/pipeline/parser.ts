import { parseStringPromise } from "xml2js";
import type { RawFeed } from "./fetcher";

export interface ParsedJob {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: string;
  postedAt: Date;
  guid: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1000);
}

function getText(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val.trim();
  if (Array.isArray(val)) return getText(val[0]);
  if (typeof val === "object" && val !== null) {
    const o = val as Record<string, unknown>;
    if ("_" in o) return String(o["_"]).trim();
  }
  return String(val).trim();
}

async function parseFeed(feed: RawFeed): Promise<ParsedJob[]> {
  try {
    const parsed = await parseStringPromise(feed.xml, {
      explicitArray: true,
      mergeAttrs: true,
    });

    // Handle both RSS 2.0 and Atom
    const channel =
      parsed?.rss?.channel?.[0] ??
      parsed?.feed ??
      null;

    if (!channel) return [];

    // RSS 2.0 items
    const items: unknown[] = channel.item ?? channel.entry ?? [];

    const jobs: ParsedJob[] = [];

    for (const item of items) {
      const i = item as Record<string, unknown>;

      const title = getText(i.title);
      if (!title) continue;

      const link = getText(i.link) || getText(i.guid);
      if (!link || !link.startsWith("http")) continue;

      const guid = getText(i.guid) || link;
      const pubDate = getText(i.pubDate) || getText(i.updated) || getText(i.published);
      const postedAt = pubDate ? new Date(pubDate) : new Date();

      // description / summary / content
      const rawDesc =
        getText(i.description) ||
        getText(i.summary) ||
        getText(i["content:encoded"]) ||
        "";
      const description = stripHtml(rawDesc);

      // Company: try category or source or feed name
      const company =
        getText(i["dc:company"]) ||
        getText(i.author) ||
        getText(i.company) ||
        feed.source;

      const location =
        getText(i["dc:region"]) ||
        getText(i["dc:country"]) ||
        getText(i.location) ||
        "Remote";

      jobs.push({
        title,
        company,
        location,
        description,
        url: link,
        source: feed.source,
        postedAt: isNaN(postedAt.getTime()) ? new Date() : postedAt,
        guid,
      });
    }

    return jobs;
  } catch (err) {
    console.error(`[Parser] Failed to parse feed ${feed.source}:`, err);
    return [];
  }
}

export async function parseAllFeeds(feeds: RawFeed[]): Promise<ParsedJob[]> {
  const allJobs: ParsedJob[] = [];

  for (const feed of feeds) {
    const jobs = await parseFeed(feed);
    console.log(`[Parser] ${feed.source}: ${jobs.length} jobs parsed`);
    allJobs.push(...jobs);
  }

  return allJobs;
}
