import { NextResponse } from "next/server";
import { getActiveAlerts } from "@/lib/alerts";

export async function GET() {
  const alerts = await getActiveAlerts();
  return NextResponse.json({ alerts });
}
