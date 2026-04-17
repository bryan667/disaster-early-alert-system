import "dotenv/config";

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

export const env = {
  get databaseUrl() {
    return requireEnv("DATABASE_URL");
  },
  get supabaseUrl() {
    return requireEnv("SUPABASE_URL");
  },
  get supabaseServiceRoleKey() {
    return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  },
  get openAiApiKey() {
    return requireEnv("OPENAI_API_KEY");
  },
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  resendApiKey: process.env.RESEND_API_KEY,
  alertEmailTo: process.env.ALERT_EMAIL_TO,
  alertEmailFrom: process.env.ALERT_EMAIL_FROM,
};
