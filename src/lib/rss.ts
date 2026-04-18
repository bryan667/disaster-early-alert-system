import Parser from 'rss-parser';
import { randomUUID } from 'node:crypto';
import { FEEDS } from '@/lib/feeds';
import { getPrisma } from '@/lib/db';
import type { FeedItem } from '@/lib/types';

const parser = new Parser({
  requestOptions: {
    headers: {
      'user-agent': 'DEAS/0.1 (janbryanmartirez@gmail.com)',
      accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
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

function buildFailedFeedSourceUrl(feedName: string) {
  const safeFeedName = feedName.trim().toLowerCase().replace(/\s+/g, '-');
  return `feed-error://${safeFeedName}/${Date.now()}-${randomUUID()}`;
}

export async function fetchFeedItems(): Promise<FeedItem[]> {
  const prisma = getPrisma();
  const batches = await Promise.allSettled(
    FEEDS.map(async (feed) => {
      const parsed = await parser.parseURL(feed.url);

      return (parsed.items ?? [])
        .filter((item) => item.link && item.title)
        .map((item) => {
          const title = item.title ?? 'Untitled';
          const snippet =
            item.contentSnippet ??
            item.content ??
            item.summary ??
            'No summary available.';

          return {
            sourceName: feed.name,
            title,
            link: item.link ?? '',
            snippet,
            publishedAt: coerceDate(item.isoDate ?? item.pubDate),
          };
        });
    }),
  );

  const successfulItems: FeedItem[] = batches.flatMap((result) =>
    result.status === 'fulfilled' ? result.value : [],
  );

  const failedLogWrites: Promise<unknown>[] = [];

  for (const [index, result] of batches.entries()) {
    if (result.status === 'rejected') {
      const feed = FEEDS[index];
      console.warn('RSS feed fetch failed:', result.reason);
      failedLogWrites.push(
        prisma.processedFeedItem.create({
          data: {
            sourceUrl: buildFailedFeedSourceUrl(feed.name),
            sourceName: feed.name,
            headline: '--',
            publishedAt: null,
            outcome: 'error',
          },
        }),
      );
    }
  }

  if (failedLogWrites.length > 0) {
    await Promise.all(failedLogWrites);
  }

  return successfulItems;
}
