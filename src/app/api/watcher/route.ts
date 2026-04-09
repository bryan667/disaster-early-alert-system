import { NextResponse } from "next/server";
import { runWatcher } from "@/lib/watcher";

export async function POST() {
  try {
    const result = await runWatcher();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown watcher error",
      },
      { status: 500 },
    );
  }
}
