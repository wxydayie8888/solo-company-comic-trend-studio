"use client";

import { Download, Film, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Episode } from "@/lib/types";

interface VideoStudioProps {
  episode: Episode;
  generatedVideoUrl: string | null;
  isActive: boolean;
  isUnlocked: boolean;
  onGenerated: (url: string) => void;
}

const canvasWidth = 720;
const canvasHeight = 1280;
const targetVideoDurationMs = 60_000;
const introDurationMs = 4_000;
const outroDurationMs = 4_000;

interface RenderResponse {
  videoUrl: string;
  frameUrls: string[];
  narrationUrls: string[];
  durationMs: number;
  providers: { image: string; tts: string };
}

export function VideoStudio({ episode, generatedVideoUrl, isActive, isUnlocked, onGenerated }: VideoStudioProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastRender, setLastRender] = useState<RenderResponse | null>(null);

  async function generateVideo() {
    if (!isUnlocked || isGenerating) return;
    setError(null);
    setIsGenerating(true);
    setProgress(0);

    try {
      const url = await renderEpisodeVideo(episode, setProgress);
      onGenerated(url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "浏览器生成视频失败，请换 Chrome 或 Edge 再试。");
    } finally {
      setIsGenerating(false);
    }
  }

  async function renderWithJimeng() {
    if (!isUnlocked || isRendering) return;
    setError(null);
    setIsRendering(true);
    try {
      const res = await fetch("/api/episode/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episode })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as RenderResponse;
      setLastRender(data);
      onGenerated(data.videoUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "服务端渲染失败");
    } finally {
      setIsRendering(false);
    }
  }

  return (
    <section className={`work-panel video-studio ${isActive ? "active-step" : ""} ${!isUnlocked ? "locked-step" : ""}`}>
      <div className="section-heading">
        <div>
          <span className="kicker">06 生成短片</span>
          <h2>把分镜录成一条真实视频</h2>
        </div>
        <Film size={20} />
      </div>
      <div className={`step-callout ${isUnlocked ? "ready" : "locked"}`}>
        {isUnlocked
          ? "两条路：浏览器端「快速预览」生成 60 秒 WebM 字幕条；服务端「漫画合成」走即梦文生图 + TTS + ffmpeg，输出 MP4。"
          : "先确认分镜，再生成短片。"}
      </div>
      <div className="video-grid">
        <div className="phone-preview">
          <div>
            <span>{generatedVideoUrl ? "已生成" : isGenerating || isRendering ? `${progress}%` : "待生成"}</span>
            <strong>{episode.topic.youthAngle}</strong>
            <p>{episode.thesis.goldenLine}</p>
          </div>
        </div>
        <div className="video-actions">
          <p>「快速预览」走浏览器 Canvas，几十秒出片可审稿；「漫画合成」调即梦+ffmpeg，1-3 分钟出片可发布。</p>
          <button className="primary-action" disabled={!isUnlocked || isGenerating || isRendering} onClick={generateVideo} type="button">
            {isGenerating ? <Loader2 className="spin" size={17} /> : <Film size={17} />}
            {isGenerating ? "正在生成预览" : "快速预览（浏览器）"}
          </button>
          <button
            className="primary-action"
            disabled={!isUnlocked || isGenerating || isRendering}
            onClick={renderWithJimeng}
            style={{ background: "var(--violet)" }}
            type="button"
          >
            {isRendering ? <Loader2 className="spin" size={17} /> : <Sparkles size={17} />}
            {isRendering ? "正在合成漫画 MP4" : "用即梦合成漫画 MP4（服务端）"}
          </button>
          {generatedVideoUrl ? (
            <a className="secondary-action" download={`${episode.id}.mp4`} href={generatedVideoUrl}>
              <Download size={17} />
              下载视频文件
            </a>
          ) : null}
          {lastRender ? (
            <p className="success-text">
              已生成 · 图像: {lastRender.providers.image} · 配音: {lastRender.providers.tts} · 时长 {Math.round(lastRender.durationMs / 1000)}s
            </p>
          ) : null}
          {error ? <p className="error-text">{error}</p> : null}
        </div>
      </div>
      {lastRender && lastRender.frameUrls.length > 0 ? (
        <div className="frame-strip">
          {lastRender.frameUrls.slice(0, 4).map((url, idx) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} alt={`frame-${idx + 1}`} src={url} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

async function renderEpisodeVideo(episode: Episode, onProgress: (progress: number) => void) {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("当前浏览器不支持 MediaRecorder，无法在页面内生成视频。");
  }

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("无法创建 Canvas 画布。");

  const mimeType = getSupportedMimeType();
  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: BlobPart[] = [];

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const stopped = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType || "video/webm" }));
  });

  recorder.start();
  drawIntro(context, episode);
  await sleep(introDurationMs);

  const frameTotalDuration = targetVideoDurationMs - introDurationMs - outroDurationMs;
  const perFrameDuration = frameTotalDuration / episode.storyboard.length;
  for (const [index, frame] of episode.storyboard.entries()) {
    const steps = 30;
    for (let step = 0; step < steps; step += 1) {
      drawFrame(context, episode, index, step / steps);
      await sleep(perFrameDuration / steps);
    }
    onProgress(Math.round(((index + 1) / episode.storyboard.length) * 100));
  }

  drawOutro(context, episode);
  await sleep(outroDurationMs);
  recorder.stop();
  const blob = await stopped;
  return URL.createObjectURL(blob);
}

function drawIntro(context: CanvasRenderingContext2D, episode: Episode) {
  drawBackground(context, "#2f7d6d", "#406f9f");
  drawTitle(context, episode.topic.youthAngle, "今天的热点，不急着站队", 150);
  drawSubtitle(context, episode.thesis.goldenLine, 840);
}

function drawOutro(context: CanvasRenderingContext2D, episode: Episode) {
  drawBackground(context, "#202124", "#2f7d6d");
  drawTitle(context, "带走一句话", episode.thesis.goldenLine, 170);
  drawSubtitle(context, episode.thesis.commentQuestion, 860);
}

function drawFrame(context: CanvasRenderingContext2D, episode: Episode, index: number, progress: number) {
  const frame = episode.storyboard[index];
  const colors = [
    ["#2f7d6d", "#406f9f"],
    ["#d86b55", "#71568d"],
    ["#d49a2a", "#406f9f"],
    ["#71568d", "#2f7d6d"],
    ["#406f9f", "#d86b55"],
    ["#2f7d6d", "#d49a2a"],
    ["#202124", "#2f7d6d"]
  ][index % 7];

  drawBackground(context, colors[0], colors[1]);
  context.fillStyle = "rgba(255,255,255,0.14)";
  context.fillRect(70 + progress * 24, 170, 580, 440);
  context.fillStyle = "rgba(255,255,255,0.88)";
  roundRect(context, 84, 184, 552, 412, 24);
  context.fillStyle = colors[0];
  context.font = "800 34px Arial, sans-serif";
  context.fillText(`0${frame.id}`, 118, 246);
  context.fillStyle = "#202124";
  drawWrappedText(context, frame.beat, 118, 320, 480, 54, 52, "800");
  context.fillStyle = "#4f575c";
  drawWrappedText(context, frame.caption, 118, 470, 480, 34, 80, "700");

  context.fillStyle = "#ffffff";
  drawWrappedText(context, frame.narration, 76, 730, 568, 36, 210, "700");
  context.fillStyle = "rgba(255,255,255,0.86)";
  context.fillRect(76, 1090, 568 * progress, 10);
  context.fillStyle = "rgba(255,255,255,0.72)";
  context.font = "700 24px Arial, sans-serif";
  context.fillText(frame.sound, 76, 1150);
}

function drawBackground(context: CanvasRenderingContext2D, from: string, to: string) {
  const gradient = context.createLinearGradient(0, 0, canvasWidth, canvasHeight);
  gradient.addColorStop(0, from);
  gradient.addColorStop(1, to);
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvasWidth, canvasHeight);
  context.fillStyle = "rgba(255,255,255,0.08)";
  context.fillRect(48, 62, 624, 1156);
}

function drawTitle(context: CanvasRenderingContext2D, label: string, title: string, y: number) {
  context.fillStyle = "rgba(255,255,255,0.72)";
  context.font = "800 26px Arial, sans-serif";
  context.fillText(label, 76, y);
  context.fillStyle = "#ffffff";
  drawWrappedText(context, title, 76, y + 90, 568, 58, 260, "900");
}

function drawSubtitle(context: CanvasRenderingContext2D, text: string, y: number) {
  context.fillStyle = "rgba(255,255,255,0.9)";
  drawWrappedText(context, text, 76, y, 568, 34, 180, "800");
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  maxHeight: number,
  weight: string
) {
  context.font = `${weight} ${fontSize}px Arial, "PingFang SC", sans-serif`;
  const chars = Array.from(text);
  const lines: string[] = [];
  let line = "";
  for (const char of chars) {
    const testLine = line + char;
    if (context.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);
  const maxLines = Math.max(1, Math.floor(maxHeight / (fontSize * 1.35)));
  lines.slice(0, maxLines).forEach((item, index) => {
    context.fillText(index === maxLines - 1 && lines.length > maxLines ? `${item.slice(0, -1)}...` : item, x, y + index * fontSize * 1.35);
  });
}

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

function getSupportedMimeType() {
  const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
