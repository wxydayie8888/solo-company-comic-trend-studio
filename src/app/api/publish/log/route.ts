import { NextResponse } from "next/server";
import { appendJson, readJson } from "@/lib/server/store";
import { Platform } from "@/lib/types";

export interface PublishLog {
  id: string;
  at: string;
  platform: Platform;
  topicId: string;
  theoryId: string;
  episodeId: string;
  title: string;
  status: "draft-copied" | "submitted-to-mcp" | "mcp-error" | "manual";
  externalId?: string;
  note?: string;
}

export const dynamic = "force-dynamic";

export async function GET() {
  const logs = await readJson<PublishLog[]>("publish_logs.json", []);
  return NextResponse.json({ logs });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<PublishLog>;
  if (!body.platform || !body.topicId || !body.title) {
    return NextResponse.json({ error: "platform/topicId/title required" }, { status: 400 });
  }
  const log: PublishLog = {
    id: `log-${Date.now()}`,
    at: new Date().toISOString(),
    platform: body.platform,
    topicId: body.topicId,
    theoryId: body.theoryId ?? "",
    episodeId: body.episodeId ?? "",
    title: body.title,
    status: body.status ?? "draft-copied",
    externalId: body.externalId,
    note: body.note
  };
  await appendJson<PublishLog>("publish_logs.json", log);
  return NextResponse.json({ ok: true, log });
}
