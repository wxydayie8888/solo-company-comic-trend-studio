import { HotTopic, Platform } from "../types";
import { askJson, isAiEnabled } from "./anthropic";
import { describeSourceForPlatform, pickProvider } from "./providers/topicSources";
import type { PlatformFetchResult, RawHotItem } from "./providers/topicSources/types";

const TARGET_PLATFORMS: Platform[] = ["小红书", "抖音", "视频号", "快手"];

const PROXY_LABEL: Record<Platform, string> = {
  小红书: "微博热搜（代理）",
  抖音: "抖音热榜",
  视频号: "知乎热榜（代理）",
  快手: "B站热榜（代理）"
};
const DIRECT_LABEL: Record<Platform, string> = {
  小红书: "小红书热门（xhs-toolkit）",
  抖音: "抖音热榜",
  视频号: "视频号热门（trend-radar）",
  快手: "快手热榜"
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^一-龥a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || `topic-${Date.now()}`;
}

function defaultSignals(heat: number) {
  return {
    accountFit: 70,
    novelty: 65,
    saveValue: 70,
    commentPotential: 70,
    brandRisk: 35,
    heat,
    emotion: Math.min(95, 60 + Math.round(heat / 10))
  };
}

interface AiTopicAssessment {
  accountFit: number;
  novelty: number;
  saveValue: number;
  commentPotential: number;
  brandRisk: number;
  emotion: number;
  summary: string;
  youthAngle: string;
  recommendedReason: string;
  rejectReasons: string[];
  riskTags: string[];
}

async function assessWithAi(title: string, platform: Platform): Promise<AiTopicAssessment | null> {
  if (!isAiEnabled()) return null;
  try {
    return await askJson<AiTopicAssessment>({
      system:
        "你是一个面向年轻人的中文社会科学短视频选题策划。读到一条热搜标题，你要从「能否解释一个社会科学概念、能否被收藏、能否激起讨论、平台风险」角度做评估。",
      user: `平台：${platform}\n标题：${title}\n\n请输出 JSON：\n{\n  "accountFit": 0-100 与「年轻人解释世界」账号的契合度,\n  "novelty": 0-100 是否还没被讲烂,\n  "saveValue": 0-100 是否值得收藏,\n  "commentPotential": 0-100 是否能激起评论,\n  "brandRisk": 0-100 越高越危险,\n  "emotion": 0-100 公共情绪强度,\n  "summary": "一句话概括讨论焦点",\n  "youthAngle": "年轻人视角下的一句话切入",\n  "recommendedReason": "为什么值得做",\n  "rejectReasons": ["最多两个不该做的理由"],\n  "riskTags": ["低风险" 或 "事实不确定"/"平台敏感"/"理论误用" 中的若干]\n}`,
      temperature: 0.4,
      maxTokens: 600
    });
  } catch (err) {
    console.error("AI topic assessment failed", err);
    return null;
  }
}

export interface FetchOutcome {
  topics: HotTopic[];
  perPlatform: Array<{
    platform: Platform;
    source: string;
    count: number;
    ok: boolean;
    proxy: boolean;
    error?: string;
  }>;
}

async function fetchOnePlatform(
  platform: Platform,
  limit: number
): Promise<PlatformFetchResult> {
  const provider = pickProvider(platform);
  const meta = describeSourceForPlatform(platform);
  try {
    const items = await provider.fetch(platform, limit);
    return { platform, source: provider.name, items, ok: true, proxy: meta.proxy };
  } catch (err) {
    return {
      platform,
      source: provider.name,
      items: [],
      ok: false,
      proxy: meta.proxy,
      error: (err as Error).message
    };
  }
}

async function buildTopic(
  platform: Platform,
  source: string,
  proxy: boolean,
  item: RawHotItem
): Promise<HotTopic | null> {
  const title = (item.title ?? "").trim();
  if (!title) return null;

  const heatRaw = typeof item.hot === "number" ? item.hot : Number(item.hot ?? 0);
  const heat = Math.min(99, Math.max(40, Math.round(Math.log10(Math.max(10, heatRaw || 100)) * 18)));

  const ai = await assessWithAi(title, platform);
  const sig = ai
    ? {
        accountFit: ai.accountFit,
        novelty: ai.novelty,
        saveValue: ai.saveValue,
        commentPotential: ai.commentPotential,
        brandRisk: ai.brandRisk,
        emotion: ai.emotion
      }
    : defaultSignals(heat);

  const sourceLabel = proxy ? PROXY_LABEL[platform] : DIRECT_LABEL[platform];

  return {
    id: slugify(title),
    platform,
    title,
    heat,
    emotion: sig.emotion,
    signals: {
      accountFit: sig.accountFit,
      novelty: sig.novelty,
      saveValue: sig.saveValue,
      commentPotential: sig.commentPotential,
      brandRisk: sig.brandRisk
    },
    summary: ai?.summary ?? item.desc ?? `${sourceLabel}：${title}`,
    sourceUrl: item.mobileUrl ?? item.url ?? "",
    sourceLabel: `${sourceLabel} · ${source}`,
    riskTags: (ai?.riskTags?.length ? ai.riskTags : ["低风险"]).filter((tag) =>
      ["事实不确定", "平台敏感", "理论误用", "低风险"].includes(tag)
    ) as HotTopic["riskTags"],
    youthAngle: ai?.youthAngle ?? "等待人工补充切入。",
    recommendedReason: ai?.recommendedReason ?? "热度足够，待评估解释空间。",
    rejectReasons: ai?.rejectReasons ?? ["可能只是一时情绪，缺少长期价值。"]
  };
}

export async function fetchHotTopicsDetailed(limitPerPlatform = 3): Promise<FetchOutcome> {
  const results = await Promise.all(TARGET_PLATFORMS.map((p) => fetchOnePlatform(p, limitPerPlatform)));

  const topics: HotTopic[] = [];
  for (const r of results) {
    for (const item of r.items) {
      const topic = await buildTopic(r.platform, r.source, r.proxy ?? false, item);
      if (topic) topics.push(topic);
    }
  }

  const perPlatform = results.map((r) => ({
    platform: r.platform,
    source: r.source,
    count: r.items.length,
    ok: r.ok,
    proxy: r.proxy ?? false,
    error: r.error
  }));

  return { topics, perPlatform };
}

// 兼容旧调用方
export async function fetchHotTopics(limitPerPlatform = 3): Promise<HotTopic[]> {
  const { topics } = await fetchHotTopicsDetailed(limitPerPlatform);
  return topics;
}
