import { createThesis } from "./theoryMatching";
import {
  ContentThesis,
  Episode,
  HotTopic,
  ResearchPacket,
  ReviewStatus,
  RiskTag,
  ScriptSegment,
  TheoryCard,
  WorkflowStatus
} from "./types";
import { buildCoverConcepts, buildDirectorFrames, buildVisualIdentity } from "./storyboardDirector";

export function reviewGate(topic: HotTopic, packet: ResearchPacket, theory: TheoryCard) {
  const warnings = new Set<RiskTag>();
  topic.riskTags.forEach((tag) => {
    if (tag !== "低风险") warnings.add(tag);
  });
  if (packet.uncertainties.length > 1 || topic.riskTags.includes("事实不确定")) warnings.add("事实不确定");
  if (theory.misuseRisk.includes("不能") || theory.misuseRisk.includes("容易")) warnings.add("理论误用");

  const hasHardBlock = warnings.has("平台敏感") && warnings.has("事实不确定");
  const status: ReviewStatus = hasHardBlock ? "blocked" : warnings.size > 0 ? "needs-review" : "ready";
  return {
    status,
    warnings: Array.from(warnings)
  };
}

function segmentStatus(reviewStatus: ReviewStatus, segmentIsSensitive = false): WorkflowStatus {
  if (reviewStatus === "blocked") return "blocked";
  if (reviewStatus === "needs-review" || segmentIsSensitive) return "needs-human";
  return "approved";
}

export function buildScriptSegments(topic: HotTopic, packet: ResearchPacket, theory: TheoryCard, thesis: ContentThesis, reviewStatus: ReviewStatus): ScriptSegment[] {
  return [
    {
      id: "hook",
      label: "3 秒钩子",
      goal: "先让观众觉得：这说的不就是我吗。",
      text: `${thesis.tensionQuestion} 先别急着站队，这里面藏着一个很重要的社会科学概念。`,
      riskHint: "避免绝对化判断和制造对立。",
      alternatives: [`${topic.youthAngle} 这句话背后，其实是一套默认规则在松动。`, `如果你也被这件事戳到，问题可能不只在你身上。`],
      status: segmentStatus(reviewStatus)
    },
    {
      id: "scene",
      label: "热点场景",
      goal: "把抽象热点变成一眼能懂的生活场景。",
      text: packet.factSummary,
      riskHint: "只讲公开讨论和可验证概括，不补未经证实的细节。",
      alternatives: [packet.perspectives[0], topic.summary],
      status: segmentStatus(reviewStatus, topic.riskTags.includes("事实不确定"))
    },
    {
      id: "conflict",
      label: "提出困惑",
      goal: "把评论区分歧转成值得思考的问题。",
      text: packet.debates[0],
      riskHint: "保留双方合理性，不把任一方画成反派。",
      alternatives: packet.debates.slice(1).length > 0 ? packet.debates.slice(1) : [thesis.tensionQuestion],
      status: segmentStatus(reviewStatus)
    },
    {
      id: "theory",
      label: "理论解释",
      goal: "用一句人话解释理论，再接回热点。",
      text: `${theory.name}说的不是大道理，而是：${theory.oneSentence} 放到这件事里，就是${theory.angle}`,
      riskHint: theory.misuseRisk,
      alternatives: theory.goldenLines.slice(0, 2),
      status: segmentStatus(reviewStatus, true)
    },
    {
      id: "turn",
      label: "反转启发",
      goal: "从情绪判断转向机制理解。",
      text: `所以这件事真正有价值的地方，是它提醒我们：${thesis.antiMisreading}`,
      riskHint: "不要把复杂问题都归因到个人认知。",
      alternatives: theory.counterExamples.slice(0, 2),
      status: segmentStatus(reviewStatus)
    },
    {
      id: "takeaway",
      label: "带走一句话",
      goal: "留下可收藏、可转发、可评论的一句话。",
      text: `${thesis.goldenLine} ${thesis.audienceTakeaway}`,
      riskHint: "结尾要有启发，不要做命令式建议。",
      alternatives: [thesis.audienceTakeaway, thesis.commentQuestion],
      status: segmentStatus(reviewStatus)
    }
  ];
}

export function createEpisode(topic: HotTopic, packet: ResearchPacket, theory: TheoryCard): Episode {
  const review = reviewGate(topic, packet, theory);
  const thesis = createThesis(topic, theory);
  const scriptSegments = buildScriptSegments(topic, packet, theory, thesis, review.status);
  const visualIdentity = buildVisualIdentity(topic);

  return {
    id: `episode-${topic.id}`,
    topic,
    selectedTheory: theory,
    thesis,
    audience: "18-30 岁，对现实有困惑、但不想听说教的年轻人",
    scriptSegments,
    visualIdentity,
    storyboard: buildDirectorFrames(topic, theory, thesis, scriptSegments, visualIdentity),
    coverConcepts: buildCoverConcepts(topic, theory, thesis),
    assets: {
      voice: "温和、聪明、不端着的青年旁白",
      bgmMood: "轻节奏 lo-fi，保留旁白清晰度",
      renderSpec: "9:16, 1080x1920, 60-90 秒, mp4, 无平台水印, 字幕避开底部操作区"
    },
    workflow: {
      topic: topic.riskTags.includes("低风险") ? "approved" : "needs-human",
      theory: review.status === "blocked" ? "blocked" : "needs-human",
      script: review.status === "ready" ? "approved" : "needs-human",
      storyboard: review.status === "blocked" ? "blocked" : "needs-human",
      publish: review.status === "ready" ? "needs-human" : review.status === "blocked" ? "blocked" : "needs-human"
    },
    reviewStatus: review.status,
    reviewWarnings: review.warnings
  };
}
