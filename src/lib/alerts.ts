import { getPool } from "@/lib/db";
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

export async function countAtRiskPolicies(city: string, barangay: string | null) {
  const pool = getPool();
  const { rows } = await pool.query<{ at_risk_count: string }>(
    `
      SELECT COUNT(*)::text AS at_risk_count
      FROM policyholders
      WHERE lower(city) = lower($1)
        AND ($2::text IS NULL OR lower(barangay) = lower($2))
    `,
    [city, barangay],
  );

  return Number(rows[0]?.at_risk_count ?? 0);
}

export async function hasRecentDuplicate(dedupeKey: string) {
  const pool = getPool();
  const { rows } = await pool.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM disaster_events
        WHERE dedupe_key = $1
          AND created_at >= NOW() - INTERVAL '6 hours'
      ) AS exists
    `,
    [dedupeKey],
  );

  return rows[0]?.exists ?? false;
}

export async function hasProcessedSource(sourceUrl: string) {
  const pool = getPool();
  const { rows } = await pool.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM processed_feed_items
        WHERE source_url = $1
      ) AS exists
    `,
    [sourceUrl],
  );

  return rows[0]?.exists ?? false;
}

export async function createDisasterEvent(input: {
  feedItem: FeedItem;
  alert: DisasterAlert;
  atRiskCount: number;
}) {
  const pool = getPool();
  const dedupeKey = buildDedupeKey(input.alert);

  const { rows } = await pool.query<AlertRecord>(
    `
      INSERT INTO disaster_events (
        source_name,
        source_url,
        headline,
        snippet,
        published_at,
        disaster_type,
        severity_description,
        city,
        barangay,
        confidence_score,
        dedupe_key,
        at_risk_count,
        raw_payload
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb)
      RETURNING *
    `,
    [
      input.feedItem.sourceName,
      input.feedItem.link,
      input.feedItem.title,
      input.feedItem.snippet,
      input.feedItem.publishedAt,
      input.alert.disasterType,
      input.alert.severity_description,
      input.alert.city,
      input.alert.barangay,
      input.alert.confidence_score,
      dedupeKey,
      input.atRiskCount,
      JSON.stringify(input.alert),
    ],
  );

  return rows[0];
}

export async function markFeedItemProcessed(input: {
  sourceUrl: string;
  sourceName: string;
  headline: string;
  publishedAt: Date | null;
  outcome: "ignored" | "duplicate" | "alerted";
}) {
  const pool = getPool();
  await pool.query(
    `
      INSERT INTO processed_feed_items (
        source_url,
        source_name,
        headline,
        published_at,
        outcome
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (source_url) DO UPDATE
      SET processed_at = NOW(),
          outcome = EXCLUDED.outcome
    `,
    [input.sourceUrl, input.sourceName, input.headline, input.publishedAt, input.outcome],
  );
}

export async function getActiveAlerts() {
  const pool = getPool();
  const { rows } = await pool.query<AlertRecord>(
    `
      SELECT *
      FROM disaster_events
      WHERE status = 'active'
      ORDER BY created_at DESC
      LIMIT 50
    `,
  );

  return rows;
}
