import { NextResponse } from "next/server";
import { runWatcherNonBlocking } from "@/lib/watcher";

export async function POST() {
  try {
    const result = await runWatcherNonBlocking();
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
