import type { Platform } from "../../../types";

export interface RawHotItem {
  title: string;
  desc?: string;
  hot?: number | string;
  url?: string;
  mobileUrl?: string;
}

export interface PlatformFetchResult {
  platform: Platform;
  source: string;
  items: RawHotItem[];
  ok: boolean;
  error?: string;
  proxy?: boolean;
}

export interface TopicSourceProvider {
  name: string;
  fetch(platform: Platform, limit: number): Promise<RawHotItem[]>;
  supports(platform: Platform): boolean;
}
