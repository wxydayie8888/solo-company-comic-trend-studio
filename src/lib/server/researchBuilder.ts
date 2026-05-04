import { HotTopic, ResearchPacket } from "../types";
import { askJson, isAiEnabled } from "./anthropic";

export async function buildResearchPacket(topic: HotTopic): Promise<ResearchPacket> {
  const fallback: ResearchPacket = {
    topicId: topic.id,
    factSummary: topic.summary,
    timeline: [],
    debates: ["（待补充）人们在什么立场上分歧？"],
    perspectives: ["（待补充）有哪些不同的解释路径？"],
    sourceNotes: [topic.sourceLabel],
    uncertainties: ["（待补充）哪些事实尚未确证？"],
    cannotSay: ["不点名具体公司、个人或具体事件细节，避免偏离事实。"]
  };

  if (!isAiEnabled()) return fallback;

  try {
    const result = await askJson<Omit<ResearchPacket, "topicId">>({
      system: "你是一名严谨的社会议题研究助理，给短视频内容写「研究包」。研究包不是观点，而是事实+争议+不可说边界。中文输出，简洁，每条不超 40 字。",
      user: `【热点】${topic.title}（${topic.platform}）\n【已知摘要】${topic.summary}\n【切入】${topic.youthAngle}\n\n请输出 JSON：\n{\n  "factSummary": "一句话概括公认事实",\n  "timeline": [{"time": "时间或阶段", "event": "事件"}],\n  "debates": ["争议点 1", "争议点 2", "争议点 3"],\n  "perspectives": ["不同立场的解释 1", "解释 2", "解释 3"],\n  "sourceNotes": ["来源类别 1", "来源类别 2"],\n  "uncertainties": ["尚未确证的事实 1", "事实 2"],\n  "cannotSay": ["不能在视频中说的话 1", "话 2"]\n}\n注意：避免点名具体公司、个人；不能编造未发生的事件。`,
      temperature: 0.4,
      maxTokens: 1200
    });
    return { topicId: topic.id, ...result };
  } catch (err) {
    console.error("AI research packet failed", err);
    return fallback;
  }
}
