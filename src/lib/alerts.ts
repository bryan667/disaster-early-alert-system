import type { DisasterEvent } from "@prisma/client";
import { getPrisma } from "@/lib/db";
import type { AlertRecord, DisasterAlert, FeedItem } from "@/lib/types";

function normalizeKeyPart(value: string | null | undefined) {
  return (value ?? "unknown")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildDedupeKey(alert: DisasterAlert) {
  return [
    normalizeKeyPart(alert.disasterType),
    normalizeKeyPart(alert.city),
    normalizeKeyPart(alert.barangay),
  ].join(":");
}

function mapAlertRecord(event: DisasterEvent): AlertRecord {
  return {
    id: event.id,
    sourceName: event.sourceName,
    sourceUrl: event.sourceUrl,
    headline: event.headline,
    snippet: event.snippet,
    disasterType: event.disasterType as AlertRecord["disasterType"],
    severityDescription: event.severityDescription,
    city: event.city,
    barangay: event.barangay,
    atRiskCount: event.atRiskCount,
    confidenceScore: Number(event.confidenceScore),
    publishedAt: event.publishedAt,
    notifiedAt: event.notifiedAt,
    createdAt: event.createdAt,
    status: event.status,
  };
}

export async function countAtRiskPolicies(city: string, barangay: string | null) {
  const prisma = getPrisma();
  return prisma.policyholder.count({
    where: {
      city: {
        equals: city,
        mode: "insensitive",
      },
      ...(barangay
        ? {
            barangay: {
              equals: barangay,
              mode: "insensitive",
            },
          }
        : {}),
    },
  });
}

export async function hasRecentDuplicate(dedupeKey: string) {
  const prisma = getPrisma();
  const duplicate = await prisma.disasterEvent.findFirst({
    where: {
      dedupeKey,
      createdAt: {
        gte: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(duplicate);
}

export async function hasProcessedSource(sourceUrl: string) {
  const prisma = getPrisma();
  const feedItem = await prisma.processedFeedItem.findUnique({
    where: {
      sourceUrl,
    },
    select: {
      sourceUrl: true,
    },
  });

  return Boolean(feedItem);
}

export async function createDisasterEvent(input: {
  feedItem: FeedItem;
  alert: DisasterAlert;
  atRiskCount: number;
}) {
  const prisma = getPrisma();
  const dedupeKey = buildDedupeKey(input.alert);

  const event = await prisma.disasterEvent.create({
    data: {
      sourceName: input.feedItem.sourceName,
      sourceUrl: input.feedItem.link,
      headline: input.feedItem.title,
      snippet: input.feedItem.snippet,
      publishedAt: input.feedItem.publishedAt,
      disasterType: input.alert.disasterType,
      severityDescription: input.alert.severity_description,
      city: input.alert.city,
      barangay: input.alert.barangay,
      confidenceScore: input.alert.confidence_score.toString(),
      dedupeKey,
      atRiskCount: input.atRiskCount,
      rawPayload: input.alert,
    },
  });

  return mapAlertRecord(event);
}

export async function markFeedItemProcessed(input: {
  sourceUrl: string;
  sourceName: string;
  headline: string;
  publishedAt: Date | null;
  outcome: "ignored" | "duplicate" | "alerted";
}) {
  const prisma = getPrisma();
  await prisma.processedFeedItem.upsert({
    where: {
      sourceUrl: input.sourceUrl,
    },
    create: {
      sourceUrl: input.sourceUrl,
      sourceName: input.sourceName,
      headline: input.headline,
      publishedAt: input.publishedAt,
      outcome: input.outcome,
    },
    update: {
      sourceName: input.sourceName,
      headline: input.headline,
      publishedAt: input.publishedAt,
      outcome: input.outcome,
      processedAt: new Date(),
    },
  });
}

export async function getActiveAlerts() {
  const prisma = getPrisma();
  const events = await prisma.disasterEvent.findMany({
    where: {
      status: "active",
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  return events.map(mapAlertRecord);
}
