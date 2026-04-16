import { getPrisma } from "@/lib/db";
import {
  buildDedupeKey,
  countAtRiskPolicies,
  createDisasterEvent,
  hasProcessedSource,
  hasRecentDuplicate,
  markFeedItemProcessed,
} from "@/lib/alerts";
import { sendAlertEmail } from "@/lib/email";
import { analyzeHeadline } from "@/lib/openai";
import { fetchFeedItems } from "@/lib/rss";

export async function runWatcher() {
  const prisma = getPrisma();
  const feedItems = await fetchFeedItems();
  const createdAlerts = [];

  for (const item of feedItems) {
    const alreadyProcessed = await hasProcessedSource(item.link);
    if (alreadyProcessed) {
      continue;
    }

    const analysis = await analyzeHeadline({
      title: item.title,
      snippet: item.snippet,
    });

    if (!analysis.isRedAlert) {
      await markFeedItemProcessed({
        sourceUrl: item.link,
        sourceName: item.sourceName,
        headline: item.title,
        publishedAt: item.publishedAt,
        outcome: "ignored",
      });
      continue;
    }

    const duplicate = await hasRecentDuplicate(buildDedupeKey(analysis));

    if (duplicate) {
      await markFeedItemProcessed({
        sourceUrl: item.link,
        sourceName: item.sourceName,
        headline: item.title,
        publishedAt: item.publishedAt,
        outcome: "duplicate",
      });
      continue;
    }

    const atRiskCount = await countAtRiskPolicies(analysis.city, analysis.barangay);
    const alert = await createDisasterEvent({
      feedItem: item,
      alert: analysis,
      atRiskCount,
    });

    const emailResult = await sendAlertEmail(alert);
    if (!emailResult.skipped) {
      await prisma.disasterEvent.update({
        where: {
          id: alert.id,
        },
        data: {
          notifiedAt: new Date(),
        },
      });
    }

    await markFeedItemProcessed({
      sourceUrl: item.link,
      sourceName: item.sourceName,
      headline: item.title,
      publishedAt: item.publishedAt,
      outcome: "alerted",
    });
    createdAlerts.push(alert);
  }

  return {
    processed: feedItems.length,
    created: createdAlerts.length,
    alerts: createdAlerts,
  };
}
