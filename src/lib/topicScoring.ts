import { HotTopic, TopicDecision, TopicSignal } from "./types";

export function getTopicScore(topic: HotTopic) {
  const { accountFit, novelty, saveValue, commentPotential, brandRisk } = topic.signals;
  const riskPenalty = topic.riskTags.includes("低风险") ? brandRisk * 0.12 : brandRisk * 0.32 + topic.riskTags.length * 5;

  return Math.max(
    0,
    Math.round(
      topic.heat * 0.18 +
        topic.emotion * 0.18 +
        accountFit * 0.22 +
        novelty * 0.12 +
        saveValue * 0.16 +
        commentPotential * 0.14 -
        riskPenalty
    )
  );
}

export function getTopicGrade(topic: HotTopic): TopicDecision["grade"] {
  const score = getTopicScore(topic);
  if (score >= 84) return "优先做";
  if (score >= 72) return "可观察";
  return "先暂缓";
}

export function getTopicDecision(topic: HotTopic): TopicDecision {
  const score = getTopicScore(topic);
  const grade = getTopicGrade(topic);
  const scoreBreakdown: TopicSignal & { heat: number; emotion: number } = {
    heat: topic.heat,
    emotion: topic.emotion,
    ...topic.signals
  };

  const recommendation =
    grade === "优先做"
      ? topic.recommendedReason
      : grade === "可观察"
        ? "题材可做，但需要先补强论点或降低风险。"
        : "今天不优先，除非有更强事实来源或独特角度。";

  const rejectReason = topic.rejectReasons[0] ?? "缺少足够明确的账号价值。";
  const status = topic.riskTags.includes("低风险") ? "approved" : "needs-human";

  return {
    score,
    grade,
    scoreBreakdown,
    recommendation,
    rejectReason,
    status
  };
}
