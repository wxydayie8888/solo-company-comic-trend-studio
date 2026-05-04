import type { Platform } from "../../../types";
import type { RawHotItem, TopicSourceProvider } from "./types";

const DEFAULT_BASE = process.env.HOT_API_BASE ?? "https://api-hot.imsyy.top";

// DailyHotApi 直接覆盖的真实平台
const DIRECT_PATH: Partial<Record<Platform, string>> = {
  抖音: "douyin",
  快手: "kuaishou"
};

// 没有真实源时降级到的代理路径
const PROXY_PATH: Record<Platform, string> = {
  小红书: "weibo",
  抖音: "douyin",
  视频号: "zhihu",
  快手: "kuaishou"
};

interface DailyHotResponse {
  data?: RawHotItem[];
}

export class DailyHotApiProvider implements TopicSourceProvider {
  name = "daily-hot";
  private base: string;

  constructor(base: string = DEFAULT_BASE) {
    this.base = base.replace(/\/+$/, "");
  }

  supports(_platform: Platform): boolean {
    return true;
  }

  isProxy(platform: Platform): boolean {
    return !DIRECT_PATH[platform];
  }

  async fetch(platform: Platform, limit: number): Promise<RawHotItem[]> {
    const path = DIRECT_PATH[platform] ?? PROXY_PATH[platform];
    const url = `${this.base}/${path}`;
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`daily-hot ${path} HTTP ${res.status}`);
    const json = (await res.json()) as DailyHotResponse;
    const items = json.data ?? [];
    return items.slice(0, limit);
  }
}
