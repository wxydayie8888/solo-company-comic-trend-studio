import { NextResponse } from "next/server";
import { isAiEnabled } from "@/lib/server/anthropic";
import { readJson } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const meta = await readJson<{ at?: string; count?: number }>("topics-fetched-at.json", {});
  return NextResponse.json({
    aiEnabled: isAiEnabled(),
    topicsFetchedAt: meta.at,
    topicsCount: meta.count
  });
}
