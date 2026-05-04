import { spawn } from "node:child_process";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

export interface FrameInput {
  imagePath: string;
  narrationPath?: string;
  caption: string;
  durationMs: number;
}

export interface ComposeOptions {
  frames: FrameInput[];
  outPath: string;
  width?: number;
  height?: number;
  bgmPath?: string;
  fontFile?: string;
  transitionMs?: number;
}

const FFMPEG = ffmpegInstaller.path;

export async function composeVideo(opts: ComposeOptions): Promise<{ outPath: string; durationMs: number }> {
  const width = opts.width ?? 1080;
  const height = opts.height ?? 1920;
  const transitionMs = opts.transitionMs ?? 350;
  await mkdir(path.dirname(opts.outPath), { recursive: true });

  const tmpDir = path.join(path.dirname(opts.outPath), ".compose-tmp");
  await mkdir(tmpDir, { recursive: true });

  const partFiles: string[] = [];
  let totalDuration = 0;

  for (let i = 0; i < opts.frames.length; i += 1) {
    const frame = opts.frames[i];
    const partPath = path.join(tmpDir, `part-${String(i).padStart(2, "0")}.mp4`);
    const seconds = Math.max(2, frame.durationMs / 1000);
    totalDuration += frame.durationMs;
    await renderFramePart(frame, partPath, { width, height, seconds, fontFile: opts.fontFile });
    partFiles.push(partPath);
  }

  const concatList = partFiles.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
  const concatListPath = path.join(tmpDir, "concat.txt");
  await writeFile(concatListPath, concatList, "utf8");

  const concatPath = path.join(tmpDir, "concat.mp4");
  await runFfmpeg([
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatListPath,
    "-c",
    "copy",
    concatPath
  ]);

  if (opts.bgmPath) {
    await runFfmpeg([
      "-y",
      "-i",
      concatPath,
      "-stream_loop",
      "-1",
      "-i",
      opts.bgmPath,
      "-filter_complex",
      "[0:a]volume=1.0[a0];[1:a]volume=0.18[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=0[aout]",
      "-map",
      "0:v",
      "-map",
      "[aout]",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-shortest",
      opts.outPath
    ]);
  } else {
    await runFfmpeg(["-y", "-i", concatPath, "-c", "copy", opts.outPath]);
  }

  await Promise.all(
    [...partFiles, concatListPath, concatPath].map((p) => unlink(p).catch(() => undefined))
  );

  void transitionMs; // reserved for xfade upgrade
  return { outPath: opts.outPath, durationMs: totalDuration };
}

interface FramePartOptions {
  width: number;
  height: number;
  seconds: number;
  fontFile?: string;
}

async function renderFramePart(frame: FrameInput, outPath: string, opts: FramePartOptions): Promise<void> {
  const inputs = ["-loop", "1", "-i", frame.imagePath];
  if (frame.narrationPath) inputs.push("-i", frame.narrationPath);
  else inputs.push("-f", "lavfi", "-i", `anullsrc=r=44100:cl=stereo`);

  const captionLines = wrapCaption(frame.caption, 18);
  const fontArg = opts.fontFile ? `:fontfile=${opts.fontFile.replace(/:/g, "\\:")}` : "";
  const drawTexts = captionLines
    .map((line, idx) => {
      const safe = line.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'");
      const y = opts.height - 360 + idx * 64;
      return `drawtext=text='${safe}'${fontArg}:fontcolor=white:fontsize=46:x=(w-text_w)/2:y=${y}:box=1:boxcolor=black@0.55:boxborderw=22`;
    })
    .join(",");

  const vf = [`scale=${opts.width}:${opts.height}:force_original_aspect_ratio=cover,crop=${opts.width}:${opts.height}`, drawTexts]
    .filter(Boolean)
    .join(",");

  const args = [
    "-y",
    ...inputs,
    "-t",
    String(opts.seconds),
    "-vf",
    vf,
    "-r",
    "30",
    "-pix_fmt",
    "yuv420p",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-shortest",
    "-movflags",
    "+faststart",
    outPath
  ];

  await runFfmpeg(args);
}

function wrapCaption(text: string, charsPerLine: number): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [""];
  const lines: string[] = [];
  for (let i = 0; i < cleaned.length; i += charsPerLine) {
    lines.push(cleaned.slice(i, i + charsPerLine));
  }
  return lines.slice(0, 3);
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exit ${code}: ${stderr.slice(-600)}`));
    });
  });
}
