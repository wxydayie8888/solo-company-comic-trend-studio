import type { Platform } from "../../types";
import type { PublishInput, PublishProvider, PublishResult } from "./types";

// 通用 HTTP 桥接：把发布请求 POST 给一个外部服务。
// 兼容 dreammis/social-auto-upload 改造的 HTTP wrapper、xhs-toolkit 的 HTTP server 模式，
// 或任何接受 { platform, title, body, hashtags, videoUrl } 的自托管服务。

interface BridgeOptions {
  url: string;
  authToken?: string;
  supports: Platform[];
  name: string;
}

export class HttpBridgePublisher implements PublishProvider {
  name: string;
  private url: string;
  private authToken?: string;
  private supportedPlatforms: Set<Platform>;

  constructor(opts: BridgeOptions) {
    this.name = opts.name;
    this.url = opts.url;
    this.authToken = opts.authToken;
    this.supportedPlatforms = new Set(opts.supports);
  }

  supports(platform: Platform): boolean {
    return this.supportedPlatforms.has(platform);
  }

  async publish(input: PublishInput): Promise<PublishResult> {
    try {
      const res = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {})
        },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(30000)
      });
      if (!res.ok) {
        const text = await res.text();
        return {
          ok: false,
          status: "error",
          message: `bridge http ${res.status}: ${text.slice(0, 200)}`
        };
      }
      const json = (await res.json().catch(() => ({}))) as Partial<PublishResult>;
      return {
        ok: json.ok ?? true,
        externalId: json.externalId,
        publishUrl: json.publishUrl,
        status: json.status ?? "submitted",
        message: json.message
      };
    } catch (err) {
      return {
        ok: false,
        status: "error",
        message: (err as Error).message
      };
    }
  }
}
