// Fetches raw RSS XML from multiple free job sources
export interface RawFeed {
  source: string;
  xml: string;
}

// Multiple free RSS job feeds - no API key needed
const RSS_FEEDS: { name: string; url: string }[] = [
  {
    name: "RemoteOK",
    url: "https://remoteok.com/remote-jobs.rss",
  },
  {
    name: "WeWorkRemotely-Programming",
    url: "https://weworkremotely.com/categories/remote-programming-jobs.rss",
  },
  {
    name: "WeWorkRemotely-Design",
    url: "https://weworkremotely.com/categories/remote-design-jobs.rss",
  },
];

async function fetchFeed(name: string, url: string): Promise<RawFeed | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Jobify/1.0; +https://jobify.app)",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
      // 15 second timeout
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.warn(`[Fetcher] ${name} returned ${res.status}`);
      return null;
    }

    const xml = await res.text();
    return { source: name, xml };
  } catch (err) {
    console.error(`[Fetcher] Failed to fetch ${name}:`, err);
    return null;
  }
}

export async function fetchAllFeeds(): Promise<RawFeed[]> {
  const results = await Promise.allSettled(
    RSS_FEEDS.map((f) => fetchFeed(f.name, f.url))
  );

  const feeds: RawFeed[] = [];
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      feeds.push(r.value);
    }
  }

  return feeds;
}
