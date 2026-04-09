import OpenAI from "openai";
import { z } from "zod";
import { env } from "@/lib/config";
import type { DisasterAlert } from "@/lib/types";

const disasterAlertSchema = z.object({
  isRedAlert: z.boolean(),
  disasterType: z.enum(["Fire", "Flood", "Earthquake", "Storm", "Volcano"]),
  severity_description: z.string(),
  city: z.string(),
  barangay: z.string().nullable(),
  confidence_score: z.number().min(0).max(1),
});

const schemaJson = {
  type: "object",
  additionalProperties: false,
  properties: {
    isRedAlert: { type: "boolean" },
    disasterType: {
      type: "string",
      enum: ["Fire", "Flood", "Earthquake", "Storm", "Volcano"],
    },
    severity_description: { type: "string" },
    city: { type: "string" },
    barangay: { type: ["string", "null"] },
    confidence_score: { type: "number" },
  },
  required: [
    "isRedAlert",
    "disasterType",
    "severity_description",
    "city",
    "barangay",
    "confidence_score",
  ],
} as const;

const SYSTEM_PROMPT = `Role: You are a Philippine Disaster Analyst for an insurance firm.

Task: Analyze the provided news headline and snippet.

Filter: Set isRedAlert to true ONLY if the event is a major disaster (for example Signal 3+ typhoon, 2nd alarm fire or higher, magnitude 6.0+ earthquake, or an actual volcanic eruption). Ignore minor traffic, small rain showers, historical stories, drills, advisories without a disaster, and duplicate recap content.

Location Extraction: Identify the specific Philippine city and barangay. If no barangay is mentioned, return null for that field.

Validation: Use a Philippine city or municipality name if present. Do not substitute a province in the city field.

Return JSON only.`;

let client: OpenAI | null = null;

function getClient() {
  client ??= new OpenAI({ apiKey: env.openAiApiKey });
  return client;
}

export async function analyzeHeadline(input: {
  title: string;
  snippet: string;
}): Promise<DisasterAlert> {
  const response = await getClient().responses.create({
    model: env.openAiModel,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: SYSTEM_PROMPT }],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Headline: ${input.title}\nSnippet: ${input.snippet}`,
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "disaster_alert",
        schema: schemaJson,
        strict: true,
      },
    },
  });

  const output = response.output_text;
  return disasterAlertSchema.parse(JSON.parse(output));
}
