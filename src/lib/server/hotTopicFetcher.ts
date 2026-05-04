import { HotTopic, Platform } from "../types";
import { askJson, isAiEnabled } from "./anthropic";

const HOT_API_BASE = process.env.HOT_API_BASE ?? "https://api-hot.imsyy.top";

interface RawHotItem {
  title?: string;
  desc?: string;
  hot?: number | string;
  url?: string;
  mobileUrl?: string;
}

interface RawHotResponse {
  data?: RawHotItem[];
}

const PLATFORM_PATHS: Array<{ platform: Platform; path: string; label: string }> = [
  { platform: "抖音", path: "douyin", label: "抖音热榜" },
  { platform: "小红书", path: "weibo", label: "微博热搜（代理小红书趋势）" },
  { platform: "视频号", path: "zhihu", label: "知乎热榜（代理视频号长内容）" },
  { platform: "快手", path: "bilibili", label: "B站热榜（代理快手潮流）" }
];

async function fetchPlatform(path: string): Promise<RawHotItem[]> {
  const url = `${HOT_API_BASE}/${path}`;
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`hot api ${path} ${res.status}`);
  const json = (await res.json()) as RawHotResponse;
  return json.data ?? [];
}

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
    const result = await askJson<AiTopicAssessment>({
      system: "你是一个面向年轻人的中文社会科学短视频选题策划。读到一条热搜标题，你要从「能否解释一个社会科学概念、能否被收藏、能否激起讨论、平台风险」角度做评估。",
      user: `平台：${platform}\n标题：${title}\n\n请输出 JSON：\n{\n  "accountFit": 0-100 与「年轻人解释世界」账号的契合度,\n  "novelty": 0-100 是否还没被讲烂,\n  "saveValue": 0-100 是否值得收藏,\n  "commentPotential": 0-100 是否能激起评论,\n  "brandRisk": 0-100 越高越危险,\n  "emotion": 0-100 公共情绪强度,\n  "summary": "一句话概括讨论焦点",\n  "youthAngle": "年轻人视角下的一句话切入",\n  "recommendedReason": "为什么值得做",\n  "rejectReasons": ["最多两个不该做的理由"],\n  "riskTags": ["低风险" 或 "事实不确定"/"平台敏感"/"理论误用" 中的若干]\n}`,
      temperature: 0.4,
      maxTokens: 600
    });
    return result;
  } catch (err) {
    console.error("AI topic assessment failed", err);
    return null;
  }
}

export async function fetchHotTopics(limitPerPlatform = 3): Promise<HotTopic[]> {
  const collected: HotTopic[] = [];

  for (const config of PLATFORM_PATHS) {
    let items: RawHotItem[] = [];
    try {
      items = await fetchPlatform(config.path);
    } catch (err) {
      console.error(`fetch ${config.path} failed`, err);
      continue;
    }

    const sliced = items.slice(0, limitPerPlatform);
    for (const item of sliced) {
      const title = (item.title ?? "").trim();
      if (!title) continue;
      const heatRaw = typeof item.hot === "number" ? item.hot : Number(item.hot ?? 0);
      const heat = Math.min(99, Math.max(40, Math.round(Math.log10(Math.max(10, heatRaw || 100)) * 18)));

      const ai = await assessWithAi(title, config.platform);
      const sig = ai
        ? {
            accountFit: ai.accountFit,
            novelty: ai.novelty,
            saveValue: ai.saveValue,
            commentPotential: ai.commentPotential,
            brandRisk: ai.brandRisk,
            heat,
            emotion: ai.emotion
          }
        : defaultSignals(heat);

      const topic: HotTopic = {
        id: slugify(title),
        platform: config.platform,
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
        summary: ai?.summary ?? item.desc ?? `${config.label}：${title}`,
        sourceUrl: item.mobileUrl ?? item.url ?? `${HOT_API_BASE}/${config.path}`,
        sourceLabel: config.label,
        riskTags: (ai?.riskTags?.length ? ai.riskTags : ["低风险"]).filter((tag) =>
          ["事实不确定", "平台敏感", "理论误用", "低风险"].includes(tag)
        ) as HotTopic["riskTags"],
        youthAngle: ai?.youthAngle ?? "等待人工补充切入。",
        recommendedReason: ai?.recommendedReason ?? "热度足够，待评估解释空间。",
        rejectReasons: ai?.rejectReasons ?? ["可能只是一时情绪，缺少长期价值。"]
      };
      collected.push(topic);
    }
  }

  return collected;
}
