import type { Platform } from "../../../types";
import { DailyHotApiProvider } from "./dailyHotApi";
import { TrendRadarProvider } from "./trendRadar";
import { XhsToolkitProvider } from "./xhsToolkit";
import type { TopicSourceProvider } from "./types";

export type SourceName = "daily-hot" | "xhs-toolkit" | "trend-radar";

const PLATFORM_ENV: Record<Platform, string> = {
  小红书: "XIAOHONGSHU_SOURCE",
  抖音: "DOUYIN_SOURCE",
  视频号: "SHIPINHAO_SOURCE",
  快手: "KUAISHOU_SOURCE"
};

const dailyHot = new DailyHotApiProvider();

function makeXhs(): XhsToolkitProvider | null {
  const base = process.env.XHS_TOOLKIT_URL;
  if (!base) return null;
  return new XhsToolkitProvider({
    base,
    token: process.env.XHS_TOOLKIT_TOKEN
  });
}

function makeTrendRadar(): TrendRadarProvider | null {
  const base = process.env.TREND_RADAR_URL;
  if (!base) return null;
  return new TrendRadarProvider({
    base,
    token: process.env.TREND_RADAR_TOKEN
  });
}

export function pickProvider(platform: Platform): TopicSourceProvider {
  const want = (process.env[PLATFORM_ENV[platform]] ?? "").toLowerCase() as SourceName | "";
  if (want === "xhs-toolkit") {
    const p = makeXhs();
    if (p && p.supports(platform)) return p;
  }
  if (want === "trend-radar") {
    const p = makeTrendRadar();
    if (p && p.supports(platform)) return p;
  }
  return dailyHot;
}

export function describeSourceForPlatform(platform: Platform): { source: SourceName; configured: boolean; proxy: boolean } {
  const want = (process.env[PLATFORM_ENV[platform]] ?? "daily-hot").toLowerCase() as SourceName;
  if (want === "xhs-toolkit") {
    return { source: "xhs-toolkit", configured: Boolean(process.env.XHS_TOOLKIT_URL), proxy: false };
  }
  if (want === "trend-radar") {
    return { source: "trend-radar", configured: Boolean(process.env.TREND_RADAR_URL), proxy: false };
  }
  return { source: "daily-hot", configured: true, proxy: dailyHot.isProxy(platform) };
}

export type { TopicSourceProvider, RawHotItem, PlatformFetchResult } from "./types";
