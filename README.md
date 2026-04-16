# Disaster Early Alert System

Starter implementation for the DEAS PRD: RSS ingestion, OpenAI-based disaster extraction, PostgreSQL policy matching, email notifications, and a simple Next.js dashboard.

## Quick start

1. Copy `.env.example` to `.env`.
2. Install dependencies with `npm install`.
3. Start local PostgreSQL with Docker using `npm run db:up`.
4. Push the Prisma schema with `npm run db:push`.
5. Seed mock policyholders with `npm run db:seed`.
6. Start the dashboard with `npm run dev`.
7. Trigger the watcher with `POST /api/watcher` or `npm run watcher:run`.
8. Stop the local database later with `npm run db:down`.

## Environment

- `DATABASE_URL`: Prisma runtime connection string. For Supabase transaction mode, use port `6543` with `?pgbouncer=true&connection_limit=1`
- `DIRECT_DATABASE_URL`: direct PostgreSQL connection string for Prisma CLI commands like `db push`
- `OPENAI_API_KEY`: OpenAI API key for disaster extraction
- `OPENAI_MODEL`: defaults to `gpt-4o-mini`
- `RESEND_API_KEY`: optional until email alerts are enabled
- `ALERT_EMAIL_TO`: recipient for alert emails
- `ALERT_EMAIL_FROM`: verified sender for Resend
