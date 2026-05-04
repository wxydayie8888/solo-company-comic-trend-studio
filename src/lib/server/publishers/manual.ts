import type { Platform } from "../../types";
import type { PublishInput, PublishProvider, PublishResult } from "./types";

const PLATFORM_URL: Record<Platform, string> = {
  小红书: "https://creator.xiaohongshu.com/publish/publish?from=menu",
  抖音: "https://creator.douyin.com/creator-micro/content/upload",
  视频号: "https://channels.weixin.qq.com/platform/post/finderNewLifeCreate",
  快手: "https://cp.kuaishou.com/article/publish/video"
};

export const manualPublisher: PublishProvider = {
  name: "manual",
  supports(): boolean {
    return true;
  },
  async publish(input: PublishInput): Promise<PublishResult> {
    return {
      ok: true,
      status: "manual",
      publishUrl: PLATFORM_URL[input.platform],
      message: "未配置自动化发布桥接，已落 publish_logs.json，请手动登录平台粘贴文案上传视频。"
    };
  }
};
