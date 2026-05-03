export type Platform = "小红书" | "抖音" | "视频号" | "快手";

export type RiskTag = "事实不确定" | "平台敏感" | "理论误用" | "低风险";

export type ReviewStatus = "ready" | "needs-review" | "blocked";

export type WorkflowStatus = "not-started" | "needs-human" | "approved" | "blocked";

export type ScriptSegmentId = "hook" | "scene" | "conflict" | "theory" | "turn" | "takeaway";

export interface TopicSignal {
  accountFit: number;
  novelty: number;
  saveValue: number;
  commentPotential: number;
  brandRisk: number;
}

export interface HotTopic {
  id: string;
  platform: Platform;
  title: string;
  heat: number;
  emotion: number;
  signals: TopicSignal;
  summary: string;
  sourceUrl: string;
  sourceLabel: string;
  riskTags: RiskTag[];
  youthAngle: string;
  recommendedReason: string;
  rejectReasons: string[];
}

export interface TimelineItem {
  time: string;
  event: string;
}

export interface ResearchPacket {
  topicId: string;
  factSummary: string;
  timeline: TimelineItem[];
  debates: string[];
  perspectives: string[];
  sourceNotes: string[];
  uncertainties: string[];
  cannotSay: string[];
}

export interface TheoryCard {
  id: string;
  name: string;
  oneSentence: string;
  explanatoryPower: number;
  misuseRisk: string;
  angle: string;
  everydayExample: string;
  bestForTopics: string[];
  misreadings: string[];
  counterExamples: string[];
  sourceRefs: string[];
  goldenLines: string[];
}

export interface ContentThesis {
  topicId: string;
  theoryId: string;
  coreClaim: string;
  antiMisreading: string;
  audienceTakeaway: string;
  tensionQuestion: string;
  goldenLine: string;
  commentQuestion: string;
}

export interface ScriptSegment {
  id: ScriptSegmentId;
  label: string;
  goal: string;
  text: string;
  riskHint: string;
  alternatives: string[];
  status: WorkflowStatus;
}

export interface VisualIdentity {
  mainCharacter: string;
  supportingCharacter: string;
  palette: string;
  lineStyle: string;
  continuityRules: string[];
}

export interface DirectorFrame {
  id: number;
  beat: string;
  role: ScriptSegmentId;
  scene: string;
  camera: string;
  composition: string;
  visualPrompt: string;
  narration: string;
  caption: string;
  subtitleTiming: string;
  safeArea: string;
  sound: string;
  transition: string;
  duration: number;
}

export interface CoverConcept {
  id: "A" | "B";
  headline: string;
  prompt: string;
  composition: string;
  platformFit: string;
}

export interface PlatformScore {
  titlePower: number;
  saveValue: number;
  commentTrigger: number;
  compliance: number;
  coverFit: number;
}

export interface Episode {
  id: string;
  topic: HotTopic;
  selectedTheory: TheoryCard;
  thesis: ContentThesis;
  audience: string;
  scriptSegments: ScriptSegment[];
  visualIdentity: VisualIdentity;
  storyboard: DirectorFrame[];
  coverConcepts: CoverConcept[];
  assets: {
    voice: string;
    bgmMood: string;
    renderSpec: string;
  };
  workflow: Record<"topic" | "theory" | "script" | "storyboard" | "publish", WorkflowStatus>;
  reviewStatus: ReviewStatus;
  reviewWarnings: RiskTag[];
}

export interface PlatformDraft {
  platform: Platform;
  titleA: string;
  titleB: string;
  body: string;
  hashtags: string[];
  pinnedComment: string;
  checklist: string[];
  publishUrl: string;
  score: PlatformScore;
  status: "draft" | "ready-for-human";
  constraints: string;
}

export interface GrowthMetric {
  date: string;
  platform: Platform;
  title: string;
  views: number;
  completionRate: number;
  likes: number;
  saves: number;
  comments: number;
  commentKeywords: string[];
}

export interface GrowthInsight {
  signal: string;
  nextMove: string;
  priority: "high" | "medium" | "low";
}

export interface GrowthSummary {
  totalViews: number;
  avgCompletion: number;
  totalSaves: number;
  commentRate: number;
  topKeywords: string[];
  insights: GrowthInsight[];
}

export interface TopicDecision {
  score: number;
  grade: "优先做" | "可观察" | "先暂缓";
  scoreBreakdown: TopicSignal & {
    heat: number;
    emotion: number;
  };
  recommendation: string;
  rejectReason: string;
  status: WorkflowStatus;
}
