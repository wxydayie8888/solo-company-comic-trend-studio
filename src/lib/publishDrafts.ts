import { Episode, Platform, PlatformDraft, PlatformScore } from "./types";

const platformOrder: Platform[] = ["小红书", "抖音", "视频号", "快手"];

const publishUrls: Record<Platform, string> = {
  小红书: "https://creator.xiaohongshu.com/publish/publish",
  抖音: "https://creator.douyin.com/creator-micro/content/upload",
  视频号: "https://channels.weixin.qq.com/platform/post/create",
  快手: "https://cp.kuaishou.com/article/publish/video"
};

function platformTone(platform: Platform) {
  return {
    小红书: {
      titleLimit: "标题短、像一句真实感受",
      bodyLead: "今天刷到这个讨论，我觉得它真正戳人的点不是表面那句话。",
      tags: ["年轻人", "认知模型", "社会观察", "自我成长"]
    },
    抖音: {
      titleLimit: "强钩子，前 12 字说清冲突",
      bodyLead: "一个热点背后，往往藏着一个理解世界的模型。",
      tags: ["热点观察", "认知", "社会科学", "年轻人"]
    },
    视频号: {
      titleLimit: "更克制，适合转发给朋友",
      bodyLead: "我们可以不急着站队，先看清这件事背后的机制。",
      tags: ["社会观察", "认知升级", "青年生活", "关系与边界"]
    },
    快手: {
      titleLimit: "口语化，少概念堆叠",
      bodyLead: "这事儿很多人有共鸣，因为它不是一个人的问题。",
      tags: ["生活观察", "普通人的困惑", "认知", "漫画短视频"]
    }
  }[platform];
}

function scoreDraft(platform: Platform, episode: Episode): PlatformScore {
  const riskPenalty = episode.reviewWarnings.length * 8;
  const titlePower = platform === "抖音" ? 88 : platform === "小红书" ? 84 : 80;

  return {
    titlePower,
    saveValue: Math.min(96, episode.topic.signals.saveValue + (episode.thesis.goldenLine.length > 8 ? 5 : 0)),
    commentTrigger: Math.min(96, episode.topic.signals.commentPotential + (episode.thesis.commentQuestion.includes("还是") ? 4 : 0)),
    compliance: Math.max(40, 96 - episode.topic.signals.brandRisk - riskPenalty),
    coverFit: platform === "小红书" ? 92 : platform === "抖音" ? 86 : 82
  };
}

export function createPlatformDrafts(episode: Episode): PlatformDraft[] {
  return platformOrder.map((platform) => {
    const tone = platformTone(platform);
    const theory = episode.selectedTheory;
    const topic = episode.topic;
    const score = scoreDraft(platform, episode);

    return {
      platform,
      titleA: platform === "抖音" ? `${topic.youthAngle}｜${theory.name}` : topic.youthAngle,
      titleB: `用${theory.name}看懂：${topic.title}`,
      body: `${tone.bodyLead}\n\n这条视频的核心论点：${episode.thesis.coreClaim}\n\n${episode.thesis.goldenLine}\n\n${episode.thesis.commentQuestion}`,
      hashtags: tone.tags,
      pinnedComment: episode.thesis.commentQuestion,
      checklist: [
        "确认事实来源与不确定信息标注",
        "确认没有具体指控和未经证实细节",
        "确认标题没有夸大、恐吓或强导流",
        "确认封面无平台水印",
        "确认字幕避开底部操作区",
        "人工预览后再发布"
      ],
      publishUrl: publishUrls[platform],
      score,
      status: episode.reviewStatus === "blocked" ? "draft" : "ready-for-human",
      constraints:
        platform === "抖音"
          ? "mp4/webm，竖版 720p 以上，15 分钟以内；发布后进入平台审核。"
          : `${tone.titleLimit}；第一版生成发布包，由人工确认上传。`
    };
  });
}
