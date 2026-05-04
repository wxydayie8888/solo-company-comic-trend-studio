import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { ImageGenInput, ImageGenResult, ImageProvider } from "./types";

const palette = [
  ["#2f7d6d", "#406f9f"],
  ["#d86b55", "#71568d"],
  ["#d49a2a", "#406f9f"],
  ["#71568d", "#2f7d6d"],
  ["#406f9f", "#d86b55"],
  ["#2f7d6d", "#d49a2a"],
  ["#202124", "#2f7d6d"],
  ["#406f9f", "#71568d"]
];

function escapeDrawText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'");
}

export const mockImageProvider: ImageProvider = {
  name: "mock",
  async generate(input: ImageGenInput, outDir: string, fileBase: string): Promise<ImageGenResult> {
    await mkdir(outDir, { recursive: true });
    const width = input.width ?? 1080;
    const height = input.height ?? 1920;
    const seed = input.seed ?? Math.abs(hashCode(input.prompt));
    const colors = palette[seed % palette.length];
    const filename = `${fileBase}.png`;
    const filePath = path.join(outDir, filename);
    const truncated = input.prompt.length > 60 ? `${input.prompt.slice(0, 57)}...` : input.prompt;
    const text = escapeDrawText(truncated);

    const filter = [
      `color=c=${colors[0]}:s=${width}x${height}:d=1`,
      `drawbox=x=60:y=160:w=${width - 120}:h=${height - 320}:color=${colors[1]}@0.85:t=fill`,
      `drawtext=text='${text}':fontcolor=white:fontsize=44:x=(w-text_w)/2:y=h/2-40:box=1:boxcolor=black@0.35:boxborderw=20`
    ].join(",");

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(
        ffmpegInstaller.path,
        ["-y", "-f", "lavfi", "-i", filter, "-frames:v", "1", filePath],
        { stdio: ["ignore", "ignore", "pipe"] }
      );
      let stderr = "";
      proc.stderr.on("data", (d) => {
        stderr += d.toString();
      });
      proc.on("error", reject);
      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg image mock exit ${code}: ${stderr.slice(-400)}`));
      });
    });

    return {
      url: `/generated/${path.basename(outDir)}/${filename}`,
      localPath: filePath,
      provider: "mock",
      promptUsed: input.prompt
    };
  }
};

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return h;
}
