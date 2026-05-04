import type { Platform } from "../../../types";
import type { RawHotItem, TopicSourceProvider } from "./types";

// HTTP bridge 到 aki66938/xhs-toolkit 的 FastAPI server。
// 期望该服务暴露 GET {base}/api/v1/explore?count=N 或类似端点，返回小红书首页推荐/热门笔记。
// 因为 xhs-toolkit 真实路径会随版本变化，这里通过 XHS_TOOLKIT_FETCH_PATH 兜底，便于用户改路径。

interface XhsItem {
  title?: string;
  desc?: string;
  note_card?: { display_title?: string; desc?: string; interact_info?: { liked_count?: string } };
  url?: string;
  share_url?: string;
  liked_count?: number | string;
  view_count?: number | string;
  hot?: number | string;
}

interface XhsResponse {
  data?: XhsItem[] | { items?: XhsItem[] };
  items?: XhsItem[];
}

export class XhsToolkitProvider implements TopicSourceProvider {
  name = "xhs-toolkit";
  private base: string;
  private path: string;
  private token?: string;

  constructor(opts: { base: string; path?: string; token?: string }) {
    this.base = opts.base.replace(/\/+$/, "");
    this.path = opts.path ?? process.env.XHS_TOOLKIT_FETCH_PATH ?? "/api/v1/hot";
    this.token = opts.token;
  }

  supports(platform: Platform): boolean {
    return platform === "小红书";
  }

  async fetch(platform: Platform, limit: number): Promise<RawHotItem[]> {
    if (platform !== "小红书") throw new Error(`xhs-toolkit only supports 小红书, got ${platform}`);
    const url = `${this.base}${this.path}${this.path.includes("?") ? "&" : "?"}count=${limit}`;
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {}
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`xhs-toolkit HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    const json = (await res.json()) as XhsResponse;
    const list = Array.isArray(json.data)
      ? json.data
      : Array.isArray((json.data as { items?: XhsItem[] } | undefined)?.items)
        ? (json.data as { items: XhsItem[] }).items
        : Array.isArray(json.items)
          ? json.items
          : [];
    return list.slice(0, limit).map(normalize);
  }
}

function normalize(item: XhsItem): RawHotItem {
  const title =
    item.title ??
    item.note_card?.display_title ??
    item.note_card?.desc ??
    item.desc ??
    "";
  const liked = item.liked_count ?? item.note_card?.interact_info?.liked_count;
  return {
    title: title.trim(),
    desc: item.desc ?? item.note_card?.desc,
    hot: item.hot ?? item.view_count ?? liked,
    url: item.share_url ?? item.url,
    mobileUrl: item.share_url ?? item.url
  };
}
