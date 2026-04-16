export type DisasterType = "Fire" | "Flood" | "Earthquake" | "Storm" | "Volcano";

export type DisasterAlert = {
  isRedAlert: boolean;
  disasterType: DisasterType;
  severity_description: string;
  city: string;
  barangay: string | null;
  confidence_score: number;
};

export type FeedItem = {
  sourceName: string;
  title: string;
  link: string;
  snippet: string;
  publishedAt: Date | null;
};

export type AlertRecord = {
  id: string;
  sourceName: string;
  sourceUrl: string;
  headline: string;
  snippet: string;
  disasterType: DisasterType;
  severityDescription: string;
  city: string;
  barangay: string | null;
  atRiskCount: number;
  confidenceScore: number;
  publishedAt: Date | null;
  notifiedAt: Date | null;
  createdAt: Date;
  status: string;
};
