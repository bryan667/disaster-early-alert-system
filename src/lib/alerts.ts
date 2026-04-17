import type { DisasterEvent } from "@prisma/client";
import { getPrisma } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase";
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

type DisasterEventRow = {
  id: string;
  source_name: string;
  source_url: string;
  headline: string;
  snippet: string;
  disaster_type: AlertRecord["disasterType"];
  severity_description: string;
  city: string;
  barangay: string | null;
  at_risk_count: number;
  confidence_score: number | string;
  published_at: string | null;
  notified_at: string | null;
  created_at: string;
  status: string;
};

function mapSupabaseAlertRecord(event: DisasterEventRow): AlertRecord {
  return {
    id: event.id,
    sourceName: event.source_name,
    sourceUrl: event.source_url,
    headline: event.headline,
    snippet: event.snippet,
    disasterType: event.disaster_type,
    severityDescription: event.severity_description,
    city: event.city,
    barangay: event.barangay,
    atRiskCount: event.at_risk_count,
    confidenceScore: Number(event.confidence_score),
    publishedAt: event.published_at ? new Date(event.published_at) : null,
    notifiedAt: event.notified_at ? new Date(event.notified_at) : null,
    createdAt: new Date(event.created_at),
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
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("disaster_events")
    .select(
      "id, source_name, source_url, headline, snippet, disaster_type, severity_description, city, barangay, at_risk_count, confidence_score, published_at, notified_at, created_at, status",
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Failed to fetch active alerts from Supabase: ${error.message}`);
  }

  return (data ?? []).map((event) => mapSupabaseAlertRecord(event as DisasterEventRow));
}
