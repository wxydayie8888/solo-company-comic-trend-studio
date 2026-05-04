import { NextResponse } from "next/server";
import { theoryCards as seedTheories, hotTopics as seedTopics } from "@/lib/seed";
import { readJson } from "@/lib/server/store";
import { rankTheories } from "@/lib/server/theoryMatcher";
import { HotTopic, TheoryCard } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = (await req.json()) as { topicId: string };
  const topics = (await readJson<HotTopic[]>("topics.json", [])).concat(seedTopics);
  const topic = topics.find((t) => t.id === body.topicId);
  if (!topic) return NextResponse.json({ error: "topic not found" }, { status: 404 });

  const stored = await readJson<TheoryCard[]>("theories.json", []);
  const theories = stored.length > 0 ? stored : seedTheories;
  const matches = await rankTheories(topic, theories, 3);
  return NextResponse.json({ matches });
}
