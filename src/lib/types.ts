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
  source_name: string;
  source_url: string;
  headline: string;
  disaster_type: DisasterType;
  severity_description: string;
  city: string;
  barangay: string | null;
  at_risk_count: number;
  confidence_score: string;
  published_at: Date | null;
  created_at: Date;
  status: string;
};
