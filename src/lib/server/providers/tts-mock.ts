import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { TtsInput, TtsProvider, TtsResult } from "./types";

const CHARS_PER_SECOND = 5; // 中文旁白大约每秒 5 字

export const mockTtsProvider: TtsProvider = {
  name: "mock-silence",
  async synthesize(input: TtsInput, outDir: string, fileBase: string): Promise<TtsResult> {
    await mkdir(outDir, { recursive: true });
    const filename = `${fileBase}.mp3`;
    const filePath = path.join(outDir, filename);
    const seconds = Math.max(2, Math.round(input.text.length / CHARS_PER_SECOND));

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(
        ffmpegInstaller.path,
        [
          "-y",
          "-f",
          "lavfi",
          "-i",
          `anullsrc=r=44100:cl=mono`,
          "-t",
          String(seconds),
          "-q:a",
          "9",
          "-acodec",
          "libmp3lame",
          filePath
        ],
        { stdio: ["ignore", "ignore", "pipe"] }
      );
      let stderr = "";
      proc.stderr.on("data", (d) => {
        stderr += d.toString();
      });
      proc.on("error", reject);
      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg tts mock exit ${code}: ${stderr.slice(-400)}`));
      });
    });

    return {
      url: `/generated/${path.basename(outDir)}/${filename}`,
      localPath: filePath,
      durationMs: seconds * 1000,
      provider: "mock-silence"
    };
  }
};
