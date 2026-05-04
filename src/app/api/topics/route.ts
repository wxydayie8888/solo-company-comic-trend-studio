import { NextResponse } from "next/server";
import { hotTopics as seedTopics } from "@/lib/seed";
import { readJson } from "@/lib/server/store";
import { HotTopic } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const stored = await readJson<HotTopic[]>("topics.json", []);
  const topics = stored.length > 0 ? stored : seedTopics;
  return NextResponse.json({ topics, source: stored.length > 0 ? "live" : "seed" });
}
