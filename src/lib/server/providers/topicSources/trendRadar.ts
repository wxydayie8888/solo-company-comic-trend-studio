import type { Platform } from "../../../types";
import type { RawHotItem, TopicSourceProvider } from "./types";

// HTTP bridge 到 sansan0/TrendRadar。它聚合 11+ 平台并自带 AI 筛选。
// 期望接口形如：GET {base}/api/trends?platform=xxx&count=N
// 平台名映射：用户传入中文 Platform，转换为 TrendRadar 内部代号（默认按拼音）。

const PLATFORM_CODE: Record<Platform, string> = {
  小红书: "xiaohongshu",
  抖音: "douyin",
  视频号: "weixin_channels",
  快手: "kuaishou"
};

interface TrendRadarItem {
  title?: string;
  description?: string;
  url?: string;
  mobile_url?: string;
  hot_value?: number | string;
  rank?: number;
}

interface TrendRadarResponse {
  data?: TrendRadarItem[];
  items?: TrendRadarItem[];
}

export class TrendRadarProvider implements TopicSourceProvider {
  name = "trend-radar";
  private base: string;
  private path: string;
  private token?: string;

  constructor(opts: { base: string; path?: string; token?: string }) {
    this.base = opts.base.replace(/\/+$/, "");
    this.path = opts.path ?? process.env.TREND_RADAR_FETCH_PATH ?? "/api/trends";
    this.token = opts.token;
  }

  supports(platform: Platform): boolean {
    return Boolean(PLATFORM_CODE[platform]);
  }

  async fetch(platform: Platform, limit: number): Promise<RawHotItem[]> {
    const code = PLATFORM_CODE[platform];
    if (!code) throw new Error(`trend-radar does not map ${platform}`);
    const sep = this.path.includes("?") ? "&" : "?";
    const url = `${this.base}${this.path}${sep}platform=${encodeURIComponent(code)}&count=${limit}`;
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {}
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`trend-radar HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    const json = (await res.json()) as TrendRadarResponse;
    const list = json.data ?? json.items ?? [];
    return list.slice(0, limit).map(normalize);
  }
}

function normalize(item: TrendRadarItem): RawHotItem {
  return {
    title: (item.title ?? "").trim(),
    desc: item.description,
    hot: item.hot_value,
    url: item.url ?? item.mobile_url,
    mobileUrl: item.mobile_url ?? item.url
  };
}
