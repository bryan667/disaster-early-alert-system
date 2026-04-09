PRD.md: Disaster Early Alert System (DEAS)
Version: 1.3

Target Region: Philippines

Sprint Duration: 20 Days

Core Stack: Node.js, TypeScript, GPT-4o mini, PostgreSQL, Resend

1. Problem Statement
Insurance operations are reactive. Teams usually discover the scale of a disaster only when claims start piling up. DEAS provides a 2-hour head start by automatically monitoring news feeds, identifying high-severity events, and matching them to the company's policyholder database at the Barangay level.

2. Technical Architecture
2.1 The Ingestion Layer (Watcher)
A Node.js cron job polls the following RSS feeds every 15 minutes:

GMA News: https://www.gmanetwork.com/news/rss/ (Fast breaking news).

Inquirer.net: https://newsinfo.inquirer.net/fullfeed (High-detail urban reports).

Google Super-Feed: https://news.google.com/rss/search?q=Philippines+(fire+OR+flood+OR+earthquake+OR+typhoon+OR+volcano)+when:1h&hl=en-PH&gl=PH&ceid=PH:en

2.2 The Intelligence Core (LLM)
We utilize GPT-4o mini in JSON Mode to act as a noise filter and geographic extractor.

The System Prompt
Role: You are a Philippine Disaster Analyst for an insurance firm.

Task: Analyze the provided news headline and snippet.

Filter: Set isRedAlert to true ONLY if the event is a major disaster (e.g., Signal 3+ Typhoon, 2nd Alarm Fire or higher, Magnitude 6.0+ Earthquake, or Actual Volcanic Eruption). Ignore minor traffic, small rain showers, or non-disaster news.

Location Extraction: Identify the specific Philippine city and barangay. If no barangay is mentioned, return null for that field.

Validation: Use standard Philippine city names (e.g., "Imus", not "Cavite").

Output Format (JSON Only):

JSON
{
  "isRedAlert": boolean,
  "disasterType": "Fire" | "Flood" | "Earthquake" | "Storm" | "Volcano",
  "severity_description": string,
  "city": string,
  "barangay": string | null,
  "confidence_score": number
}
2.3 The Data Matcher (Database)
The extracted JSON is used to query the PostgreSQL policyholder table.

SQL Query:

SQL
SELECT count(*) AS at_risk_count 
FROM policyholders 
WHERE city = {{extractedCity}} 
AND ({{extractedBarangay}} IS NULL OR barangay = {{extractedBarangay}});
3. Implementation Roadmap (20-Day Sprint)
Phase 1: Ingestion & Extraction (Days 1–7)
Goal: A working script that reads RSS and outputs structured JSON.

Tasks:

Setup rss-parser in Node.js.

Implement OpenAI API with the specified prompt.

Implement a "Seen Item" cache (Redis or local array) to prevent re-processing the same news.

Phase 2: Database & Matching (Days 8–13)
Goal: Successfully count affected policies from a news event.

Tasks:

Setup PostgreSQL/Supabase.

Seed with 10k mock policyholders (focusing on high-risk areas like Cavite/Metro Manila).

Write the hierarchical matching logic (Barangay -> City).

Phase 3: Notifications & UI (Days 14–20)
Goal: A functional dashboard and email alert system.

Tasks:

Integrate Resend for email alerts.

Build a simple Next.js dashboard using Shadcn/ui tables.

End-to-end testing: Manually inject a "Red Alert" news item and verify the email arrives with the correct count.

4. MVP Functional Requirements
Smart Filtering: The LLM must ignore "false alarms" (e.g., news about a fire in 2023).

Deduplication: No duplicate emails for the same event within 6 hours.

Dashboard View:

List of "Active Red Alerts."

"Impact Estimate" (Number of policies affected).

Link to the original news source.

Email Body: Clear subject line: [ALERT] {{disasterType}} in {{city}}, {{barangay}} - {{count}} Policies at Risk.

5. Success Metrics
Lead Time: System identifies the disaster and calculates impact within 30 minutes of the news being published.

Precision: At least 85% of alerts correctly identify the affected City.

Efficiency: The insurance team receives the "Impact Estimate" at least 1 hour before the first surge of claim calls.