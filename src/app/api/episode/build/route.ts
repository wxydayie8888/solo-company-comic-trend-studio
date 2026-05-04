import { NextResponse } from "next/server";
import { researchPackets as seedResearch, theoryCards as seedTheories, hotTopics as seedTopics } from "@/lib/seed";
import { createEpisode } from "@/lib/scriptBuilder";
import { readJson } from "@/lib/server/store";
import type { HotTopic, ResearchPacket, ScriptSegment, TheoryCard } from "@/lib/types";

export const dynamic = "force-dynamic";

interface BuildBody {
  topicId: string;
  theoryId: string;
  scriptSegments?: ScriptSegment[];
  thesisOverride?: Partial<{
    coreClaim: string;
    antiMisreading: string;
    audienceTakeaway: string;
    tensionQuestion: string;
    goldenLine: string;
    commentQuestion: string;
  }>;
}

export async function POST(req: Request) {
  const body = (await req.json()) as BuildBody;
  if (!body.topicId || !body.theoryId) {
    return NextResponse.json({ error: "topicId and theoryId required" }, { status: 400 });
  }

  const liveTopics = await readJson<HotTopic[]>("topics.json", []);
  const topics = [...liveTopics, ...seedTopics];
  const topic = topics.find((t) => t.id === body.topicId);
  if (!topic) return NextResponse.json({ error: "topic not found" }, { status: 404 });

  const liveTheories = await readJson<TheoryCard[]>("theories.json", []);
  const theories = liveTheories.length > 0 ? liveTheories : seedTheories;
  const theory = theories.find((t) => t.id === body.theoryId);
  if (!theory) return NextResponse.json({ error: "theory not found" }, { status: 404 });

  const cache = await readJson<Record<string, ResearchPacket>>("research.json", {});
  const packet = cache[topic.id] ?? seedResearch[topic.id] ?? defaultPacket(topic);

  const episode = createEpisode(topic, packet, theory);

  if (body.scriptSegments && body.scriptSegments.length > 0) {
    episode.scriptSegments = body.scriptSegments;
  }
  if (body.thesisOverride) {
    episode.thesis = { ...episode.thesis, ...body.thesisOverride };
  }

  return NextResponse.json({ episode });
}

function defaultPacket(topic: HotTopic): ResearchPacket {
  return {
    topicId: topic.id,
    factSummary: topic.summary,
    timeline: [],
    debates: ["公众围绕这件事的分歧点尚待整理。"],
    perspectives: [topic.youthAngle],
    sourceNotes: [topic.sourceLabel],
    uncertainties: ["待补充事实细节。"],
    cannotSay: ["不点名具体公司或个人。"]
  };
}
