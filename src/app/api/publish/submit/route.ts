import { NextResponse } from "next/server";
import { getPublisherFor, type PublishInput } from "@/lib/server/publishers";
import { appendJson } from "@/lib/server/store";
import type { PublishLog } from "../log/route";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const input = (await req.json()) as PublishInput;
  if (!input.platform || !input.title || !input.videoUrl) {
    return NextResponse.json({ error: "platform/title/videoUrl required" }, { status: 400 });
  }

  const provider = getPublisherFor(input.platform);
  const result = await provider.publish(input);

  const log: PublishLog = {
    id: `log-${Date.now()}`,
    at: new Date().toISOString(),
    platform: input.platform,
    topicId: input.topicId,
    theoryId: input.theoryId,
    episodeId: input.episodeId,
    title: input.title,
    status: result.status === "submitted" ? "submitted-to-mcp" : result.status === "error" ? "mcp-error" : "draft-copied",
    externalId: result.externalId,
    note: `${provider.name}${result.message ? `: ${result.message}` : ""}`
  };
  await appendJson<PublishLog>("publish_logs.json", log);

  return NextResponse.json({ ...result, provider: provider.name });
}
