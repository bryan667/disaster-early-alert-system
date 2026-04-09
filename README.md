# Disaster Early Alert System

Starter implementation for the DEAS PRD: RSS ingestion, OpenAI-based disaster extraction, PostgreSQL policy matching, email notifications, and a simple Next.js dashboard.

## Quick start

1. Copy `.env.example` to `.env`.
2. Create a PostgreSQL database and apply [`db/schema.sql`](./db/schema.sql).
3. Install dependencies with `npm install`.
4. Seed mock policyholders with `npm run db:seed`.
5. Start the dashboard with `npm run dev`.
6. Trigger the watcher with `POST /api/watcher` or `npm run watcher:run`.

## Environment

- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key for disaster extraction
- `OPENAI_MODEL`: defaults to `gpt-4o-mini`
- `RESEND_API_KEY`: optional until email alerts are enabled
- `ALERT_EMAIL_TO`: recipient for alert emails
- `ALERT_EMAIL_FROM`: verified sender for Resend
