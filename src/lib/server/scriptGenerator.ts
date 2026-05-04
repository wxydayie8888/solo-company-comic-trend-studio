import { reviewGate, buildScriptSegments } from "../scriptBuilder";
import { ContentThesis, HotTopic, ResearchPacket, ScriptSegment, TheoryCard } from "../types";
import { askJson, isAiEnabled } from "./anthropic";

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

interface AiSegment {
  id: ScriptSegment["id"];
  text: string;
  alternatives?: string[];
  riskHint?: string;
}

interface AiScriptResponse {
  thesis: {
    coreClaim: string;
    antiMisreading: string;
    audienceTakeaway: string;
    tensionQuestion: string;
    goldenLine: string;
    commentQuestion: string;
  };
  segments: AiSegment[];
}

export async function generateScript(
  topic: HotTopic,
  packet: ResearchPacket | undefined,
  theory: TheoryCard
): Promise<{ thesis: ContentThesis; segments: ScriptSegment[]; aiUsed: boolean }> {
  const safePacket = packet ?? defaultPacket(topic);
  const fallbackThesis: ContentThesis = {
    topicId: topic.id,
    theoryId: theory.id,
    coreClaim: `用「${theory.name}」解释 ${topic.title} 背后的真实张力。`,
    antiMisreading: theory.misreadings[0] ?? "避免把现象简化为个人态度问题。",
    audienceTakeaway: `下次遇到类似情况，可以先问：${theory.name}里我处在哪一格？`,
    tensionQuestion: `${topic.title}：是个人选择，还是结构性压力？`,
    goldenLine: theory.goldenLines[0] ?? `${theory.name}：让人崩溃的，从来不是表面那一件事。`,
    commentQuestion: `你会怎么解释 ${topic.title}？评论区一起聊聊。`
  };
  const review = reviewGate(topic, safePacket, theory);
  const fallback = buildScriptSegments(topic, safePacket, theory, fallbackThesis, review.status);

  if (!isAiEnabled()) {
    return { thesis: fallbackThesis, segments: fallback, aiUsed: false };
  }

  try {
    const research = packet
      ? `事实：${packet.factSummary}\n争议：${packet.debates.join("；")}\n不可说：${packet.cannotSay.join("；")}`
      : "（暂无研究包）";

    const result = await askJson<AiScriptResponse>({
      system: "你是一位中文短视频导演，擅长用社会科学概念解释热点。受众是 22-32 岁年轻人，用小红书友好的口吻：诚恳、好奇、不油腻、避免说教。每条短视频 60-90 秒，6 段结构：hook（钩子）/scene（场景）/conflict（冲突）/theory（理论解释）/turn（反转）/takeaway（带走一句话）。",
      user: `请为以下热点写一支漫画短视频脚本：

【热点】${topic.title}（${topic.platform}）
【年轻人切入】${topic.youthAngle}
【研究包】${research}
【理论卡片】${theory.name} —— ${theory.oneSentence}
理论金句备选：${theory.goldenLines.join(" / ")}
误读风险：${theory.misuseRisk}

输出 JSON：
{
  "thesis": {
    "coreClaim": "核心论点（一句）",
    "antiMisreading": "防误读（一句）",
    "audienceTakeaway": "受众带走（一句）",
    "tensionQuestion": "张力问题（一句）",
    "goldenLine": "结尾金句（一句，朗朗上口）",
    "commentQuestion": "结尾引导评论的一个问题"
  },
  "segments": [
    {"id": "hook", "text": "20 字内开场，立刻让人停下", "alternatives": ["备选 A", "备选 B"], "riskHint": "可能踩坑的提醒"},
    {"id": "scene", "text": "一个具体场景，让人代入", "alternatives": ["..."], "riskHint": "..."},
    {"id": "conflict", "text": "矛盾点，引出问题", "alternatives": ["..."], "riskHint": "..."},
    {"id": "theory", "text": "用一句话讲理论是什么", "alternatives": ["..."], "riskHint": "..."},
    {"id": "turn", "text": "反转或新视角", "alternatives": ["..."], "riskHint": "..."},
    {"id": "takeaway", "text": "结尾带走一句话", "alternatives": ["..."], "riskHint": "..."}
  ]
}

约束：每段 30-60 字。不要鸡汤、不要居高临下、不要点名具体公司或个人。`,
      temperature: 0.8,
      maxTokens: 2000
    });

    const segments: ScriptSegment[] = fallback.map((seg) => {
      const found = result.segments.find((s) => s.id === seg.id);
      if (!found) return seg;
      return {
        ...seg,
        text: found.text,
        alternatives: found.alternatives ?? seg.alternatives,
        riskHint: found.riskHint ?? seg.riskHint
      };
    });

    const thesis: ContentThesis = {
      topicId: topic.id,
      theoryId: theory.id,
      ...result.thesis
    };

    return { thesis, segments, aiUsed: true };
  } catch (err) {
    console.error("AI script generation failed", err);
    return { thesis: fallbackThesis, segments: fallback, aiUsed: false };
  }
}
