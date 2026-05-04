import { NextResponse } from "next/server";
import type { Episode } from "@/lib/types";

export const dynamic = "force-dynamic";

// 预览每帧将要送给即梦的 prompt，方便人工微调。
function buildImagePrompt(frame: Episode["storyboard"][number], identity: Episode["visualIdentity"]): string {
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
  return parts.join("，");
}

export async function POST(req: Request) {
  const body = (await req.json()) as { episode?: Episode };
  if (!body.episode) return NextResponse.json({ error: "episode required" }, { status: 400 });
  const prompts = body.episode.storyboard.map((frame) => ({
    frameId: frame.id,
    beat: frame.beat,
    narration: frame.narration,
    prompt: buildImagePrompt(frame, body.episode!.visualIdentity)
  }));
  return NextResponse.json({ prompts });
}
