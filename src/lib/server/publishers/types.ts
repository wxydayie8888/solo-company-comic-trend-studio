import type { Platform } from "../../types";

export interface PublishInput {
  platform: Platform;
  title: string;
  body: string;
  hashtags: string[];
  videoUrl: string; // 项目内的 /generated/... 或绝对 URL
  coverUrl?: string;
  topicId: string;
  theoryId: string;
  episodeId: string;
}

export interface PublishResult {
  ok: boolean;
  externalId?: string;
  publishUrl?: string;
  status: "submitted" | "queued" | "manual" | "error";
  message?: string;
}

export interface PublishProvider {
  name: string;
  supports(platform: Platform): boolean;
  publish(input: PublishInput): Promise<PublishResult>;
}
