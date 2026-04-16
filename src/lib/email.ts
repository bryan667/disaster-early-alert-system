import { Resend } from "resend";
import { env } from "@/lib/config";
import type { AlertRecord } from "@/lib/types";

let client: Resend | null = null;

function getClient() {
  if (!env.resendApiKey || !env.alertEmailFrom || !env.alertEmailTo) {
    return null;
  }

  client ??= new Resend(env.resendApiKey);
  return client;
}

export async function sendAlertEmail(alert: AlertRecord) {
  const resend = getClient();

  if (!resend) {
    return { skipped: true as const };
  }

  const location = [alert.city, alert.barangay].filter(Boolean).join(", ");
  const subject = `[ALERT] ${alert.disasterType} in ${location} - ${alert.atRiskCount} Policies at Risk`;

  await resend.emails.send({
    from: env.alertEmailFrom!,
    to: env.alertEmailTo!,
    subject,
    html: `
      <h1>Disaster Early Alert</h1>
      <p><strong>Event:</strong> ${alert.headline}</p>
      <p><strong>Type:</strong> ${alert.disasterType}</p>
      <p><strong>Location:</strong> ${location}</p>
      <p><strong>Severity:</strong> ${alert.severityDescription}</p>
      <p><strong>Policies at Risk:</strong> ${alert.atRiskCount}</p>
      <p><a href="${alert.sourceUrl}">Open source article</a></p>
    `,
  });

  return { skipped: false as const };
}
