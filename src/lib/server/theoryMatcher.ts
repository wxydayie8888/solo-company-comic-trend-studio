import { HotTopic, TheoryCard } from "../types";
import { askJson, isAiEnabled } from "./anthropic";

export interface TheoryMatch {
  theoryId: string;
  fit: number;
  reason: string;
  caution: string;
}

export async function rankTheories(topic: HotTopic, theories: TheoryCard[], topN = 3): Promise<TheoryMatch[]> {
  const ruleBased = theories
    .map((t) => ({
      theoryId: t.id,
      fit:
        (t.bestForTopics.includes(topic.id) ? 30 : 0) +
        Math.round(t.explanatoryPower * 0.7),
      reason: `${t.name}的解释力为 ${t.explanatoryPower}，适用主题：${t.bestForTopics.join("、") || "通用"}。`,
      caution: t.misuseRisk
    }))
    .sort((a, b) => b.fit - a.fit)
    .slice(0, topN);

  if (!isAiEnabled()) return ruleBased;

  try {
    const compactList = theories
      .map((t) => `- ${t.id} | ${t.name}：${t.oneSentence}（误用：${t.misuseRisk}）`)
      .join("\n");

    const result = await askJson<TheoryMatch[]>({
      system: "你是社会科学顾问。给定一条中文热点和一份理论候选清单，挑出最能解释它的 3 个理论，并给出契合度与误用提醒。只用清单中的 id。",
      user: `【热点】${topic.title}\n【切入】${topic.youthAngle}\n\n【理论清单】\n${compactList}\n\n输出 JSON 数组（按 fit 降序）：\n[\n  {"theoryId": "id", "fit": 0-100, "reason": "为什么这个理论能解释（一句）", "caution": "用它时容易踩的坑（一句）"}\n]\n至多 ${topN} 条。`,
      temperature: 0.3,
      maxTokens: 1000
    });

    const valid = result.filter((m) => theories.some((t) => t.id === m.theoryId));
    if (valid.length === 0) return ruleBased;
    return valid.slice(0, topN);
  } catch (err) {
    console.error("AI theory match failed", err);
    return ruleBased;
  }
}
