import { NextResponse } from "next/server";
import { researchPackets as seedResearch, theoryCards as seedTheories, hotTopics as seedTopics } from "@/lib/seed";
import { generateScript } from "@/lib/server/scriptGenerator";
import { readJson } from "@/lib/server/store";
import { HotTopic, ResearchPacket, TheoryCard } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = (await req.json()) as { topicId: string; theoryId: string };
  const topics = (await readJson<HotTopic[]>("topics.json", [])).concat(seedTopics);
  const topic = topics.find((t) => t.id === body.topicId);
  if (!topic) return NextResponse.json({ error: "topic not found" }, { status: 404 });

  const storedTheories = await readJson<TheoryCard[]>("theories.json", []);
  const theories = storedTheories.length > 0 ? storedTheories : seedTheories;
  const theory = theories.find((t) => t.id === body.theoryId);
  if (!theory) return NextResponse.json({ error: "theory not found" }, { status: 404 });

  const cache = await readJson<Record<string, ResearchPacket>>("research.json", {});
  const packet = cache[topic.id] ?? seedResearch[topic.id];

  const result = await generateScript(topic, packet, theory);
  return NextResponse.json(result);
}
