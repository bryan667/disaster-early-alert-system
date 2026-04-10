import Parser from "rss-parser";
import { FEEDS } from "@/lib/feeds";
import type { FeedItem } from "@/lib/types";

const parser = new Parser({
  requestOptions: {
    headers: {
      "user-agent": "DEAS/0.1 (+https://localhost)",
      accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
    },
  },
});

function coerceDate(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function fetchFeedItems(): Promise<FeedItem[]> {
  const batches = await Promise.allSettled(
    FEEDS.map(async (feed) => {
      const parsed = await parser.parseURL(feed.url);

      return (parsed.items ?? [])
        .filter((item) => item.link && item.title)
        .map((item) => ({
          sourceName: feed.name,
          title: item.title ?? "Untitled",
          link: item.link ?? "",
          snippet:
            item.contentSnippet ?? item.content ?? item.summary ?? "No summary available.",
          publishedAt: coerceDate(item.isoDate ?? item.pubDate),
        }));
    }),
  );

  const successfulItems = batches.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );

  for (const result of batches) {
    if (result.status === "rejected") {
      console.warn("RSS feed fetch failed:", result.reason);
    }
  }

  return successfulItems;
}
