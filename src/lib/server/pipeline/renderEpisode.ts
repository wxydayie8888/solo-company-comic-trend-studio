import path from "node:path";
import { writeJson } from "../store";
import { composeVideo } from "../video/composer";
import { describeProviders, getImageProvider, getTtsProvider } from "../providers";
import type { DirectorFrame, Episode, VisualIdentity } from "../../types";

export interface RenderProgress {
  step: "image" | "tts" | "compose" | "done";
  index?: number;
  total?: number;
  message?: string;
}

export interface RenderResult {
  videoUrl: string;
  videoPath: string;
  frameUrls: string[];
  narrationUrls: string[];
  durationMs: number;
  providers: { image: string; tts: string };
}

const PUBLIC_DIR = path.join(process.cwd(), "public", "generated");

function buildImagePrompt(frame: DirectorFrame, identity: VisualIdentity): string {
  // 漫画风格 prompt：识别漫画分格 + 角色一致性 + 美学
  const parts = [
    "中文社交媒体漫画分镜，竖屏构图，干净线稿，柔和阴影",
    `主角设定：${identity.mainCharacter}`,
    `配角设定：${identity.supportingCharacter}`,
    `画面：${frame.visualPrompt}`,
    `场景：${frame.scene}`,
    `镜头：${frame.camera}`,
    `构图：${frame.composition}`,
    `色调：${identity.palette}`,
    `线条：${identity.lineStyle}`,
    "高对比度、信息层级清楚、留出底部 360px 字幕安全区"
  ];
  return parts.filter(Boolean).join("，");
}

function buildNegativePrompt(): string {
  return "真人照片，logo，水印，文字溢出画面，畸形手部，多余手指，模糊，低画质";
}

export async function renderEpisode(
  episode: Episode,
  onProgress?: (p: RenderProgress) => void
): Promise<RenderResult> {
  const imageProvider = getImageProvider();
  const ttsProvider = getTtsProvider();
  const episodeDir = path.join(PUBLIC_DIR, episode.id);

  const frameUrls: string[] = [];
  const framePaths: string[] = [];
  const narrationUrls: string[] = [];
  const narrationPaths: string[] = [];
  const narrationDurations: number[] = [];

  // 1) 漫画图 — 每帧一张
  for (let i = 0; i < episode.storyboard.length; i += 1) {
    const frame = episode.storyboard[i];
    onProgress?.({ step: "image", index: i + 1, total: episode.storyboard.length });
    const prompt = buildImagePrompt(frame, episode.visualIdentity);
    const result = await imageProvider.generate(
      {
        prompt,
        negativePrompt: buildNegativePrompt(),
        width: 1080,
        height: 1920,
        seed: hashStringToInt(`${episode.id}-${frame.id}-${episode.visualIdentity.mainCharacter}`),
        styleHint: episode.visualIdentity.lineStyle
      },
      episodeDir,
      `frame-${String(frame.id).padStart(2, "0")}`
    );
    frameUrls.push(result.url);
    framePaths.push(result.localPath);
  }

  // 2) TTS — 每帧一段旁白
  for (let i = 0; i < episode.storyboard.length; i += 1) {
    const frame = episode.storyboard[i];
    onProgress?.({ step: "tts", index: i + 1, total: episode.storyboard.length });
    if (!frame.narration?.trim()) {
      narrationUrls.push("");
      narrationPaths.push("");
      narrationDurations.push(2000);
      continue;
    }
    const result = await ttsProvider.synthesize(
      { text: frame.narration, voice: process.env.BYTEDANCE_TTS_VOICE, speed: 1.0 },
      episodeDir,
      `narration-${String(frame.id).padStart(2, "0")}`
    );
    narrationUrls.push(result.url);
    narrationPaths.push(result.localPath);
    narrationDurations.push(result.durationMs);
  }

  // 3) ffmpeg 合成
  onProgress?.({ step: "compose" });
  const videoPath = path.join(episodeDir, "final.mp4");
  const compose = await composeVideo({
    frames: episode.storyboard.map((frame, idx) => ({
      imagePath: framePaths[idx],
      narrationPath: narrationPaths[idx] || undefined,
      caption: frame.caption || frame.narration || frame.beat,
      durationMs: Math.max(narrationDurations[idx] + 400, frame.duration * 1000)
    })),
    outPath: videoPath,
    width: 1080,
    height: 1920,
    bgmPath: process.env.BGM_PATH,
    fontFile: process.env.SUBTITLE_FONT
  });

  const videoUrl = `/generated/${episode.id}/final.mp4`;
  const providers = describeProviders();
  const summary: RenderResult = {
    videoUrl,
    videoPath: compose.outPath,
    frameUrls,
    narrationUrls,
    durationMs: compose.durationMs,
    providers
  };

  await writeJson(`render-${episode.id}.json`, {
    ...summary,
    at: new Date().toISOString(),
    title: episode.thesis.goldenLine
  });

  onProgress?.({ step: "done" });
  return summary;
}

function hashStringToInt(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 2_147_483_647;
}
