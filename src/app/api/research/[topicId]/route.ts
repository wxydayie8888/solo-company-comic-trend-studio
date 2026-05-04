import { NextResponse } from "next/server";
import { researchPackets as seedResearch, hotTopics as seedTopics } from "@/lib/seed";
import { buildResearchPacket } from "@/lib/server/researchBuilder";
import { readJson, writeJson } from "@/lib/server/store";
import { HotTopic, ResearchPacket } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(_req: Request, ctx: { params: { topicId: string } }) {
  const { topicId } = ctx.params;
  const cache = await readJson<Record<string, ResearchPacket>>("research.json", {});
  if (cache[topicId]) return NextResponse.json({ packet: cache[topicId], source: "cache" });
  if (seedResearch[topicId]) return NextResponse.json({ packet: seedResearch[topicId], source: "seed" });

  const stored = await readJson<HotTopic[]>("topics.json", []);
  const all = [...stored, ...seedTopics];
  const topic = all.find((t) => t.id === topicId);
  if (!topic) return NextResponse.json({ error: "topic not found" }, { status: 404 });

  const packet = await buildResearchPacket(topic);
  cache[topicId] = packet;
  await writeJson("research.json", cache);
  return NextResponse.json({ packet, source: "ai" });
}
