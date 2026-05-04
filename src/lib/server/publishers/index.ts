import type { Platform } from "../../types";
import { HttpBridgePublisher } from "./http-bridge";
import { manualPublisher } from "./manual";
import type { PublishProvider } from "./types";

const platforms: Platform[] = ["小红书", "抖音", "视频号", "快手"];

let cached: PublishProvider[] | null = null;

function loadProviders(): PublishProvider[] {
  if (cached) return cached;
  const list: PublishProvider[] = [];

  // xhs-toolkit MCP 通常起在 http://127.0.0.1:8080；这里允许走 http-bridge HTTP 模式
  if (process.env.XHS_TOOLKIT_URL) {
    list.push(
      new HttpBridgePublisher({
        name: "xhs-toolkit",
        url: process.env.XHS_TOOLKIT_URL,
        authToken: process.env.XHS_TOOLKIT_TOKEN,
        supports: ["小红书"]
      })
    );
  }

  // dreammis/social-auto-upload 包装 HTTP 后可同时发抖音/视频号/快手
  if (process.env.SOCIAL_AUTO_UPLOAD_URL) {
    list.push(
      new HttpBridgePublisher({
        name: "social-auto-upload",
        url: process.env.SOCIAL_AUTO_UPLOAD_URL,
        authToken: process.env.SOCIAL_AUTO_UPLOAD_TOKEN,
        supports: ["抖音", "视频号", "快手"]
      })
    );
  }

  list.push(manualPublisher);
  cached = list;
  return list;
}

export function getPublisherFor(platform: Platform): PublishProvider {
  const providers = loadProviders();
  return providers.find((p) => p.supports(platform)) ?? manualPublisher;
}

export function describePublishers(): { platform: Platform; provider: string }[] {
  return platforms.map((platform) => ({ platform, provider: getPublisherFor(platform).name }));
}

export type { PublishInput, PublishResult } from "./types";
