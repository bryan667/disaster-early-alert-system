CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS policyholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  barangay TEXT NOT NULL,
  policy_type TEXT NOT NULL,
  premium_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policyholders_city_barangay
  ON policyholders (city, barangay);

CREATE TABLE IF NOT EXISTS processed_feed_items (
  source_url TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  headline TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  outcome TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS disaster_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  headline TEXT NOT NULL,
  snippet TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  disaster_type TEXT NOT NULL,
  severity_description TEXT NOT NULL,
  city TEXT NOT NULL,
  barangay TEXT,
  confidence_score NUMERIC(4, 3) NOT NULL,
  dedupe_key TEXT NOT NULL,
  at_risk_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  raw_payload JSONB NOT NULL,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disaster_events_lookup
  ON disaster_events (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_disaster_events_dedupe
  ON disaster_events (dedupe_key, created_at DESC);
