import { NextResponse } from "next/server";
import { isAiEnabled } from "@/lib/server/anthropic";
import { describeProviders } from "@/lib/server/providers";
import { describePublishers } from "@/lib/server/publishers";
import { readJson } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const meta = await readJson<{ at?: string; count?: number }>("topics-fetched-at.json", {});
  const providers = describeProviders();
  return NextResponse.json({
    aiEnabled: isAiEnabled(),
    imageProvider: providers.image,
    ttsProvider: providers.tts,
    publishers: describePublishers(),
    topicsFetchedAt: meta.at,
    topicsCount: meta.count
  });
}
