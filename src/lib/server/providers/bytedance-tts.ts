import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { TtsInput, TtsProvider, TtsResult } from "./types";

// 豆包语音合成 HTTP（非流式）endpoint。
// docs: https://www.volcengine.com/docs/6561/79817
// Authorization 格式特殊：`Bearer;{access_token}`（注意是分号而非空格）。

const ENDPOINT = "https://openspeech.bytedance.com/api/v1/tts";

interface TtsResponse {
  code?: number;
  message?: string;
  data?: string; // base64 audio
  duration?: string; // ms
}

export class BytedanceTtsProvider implements TtsProvider {
  name = "bytedance";
  private appid: string;
  private accessToken: string;
  private cluster: string;
  private defaultVoice: string;

  constructor(opts: { appid: string; accessToken: string; cluster?: string; defaultVoice?: string }) {
    this.appid = opts.appid;
    this.accessToken = opts.accessToken;
    this.cluster = opts.cluster ?? process.env.BYTEDANCE_TTS_CLUSTER ?? "volcano_tts";
    // BV001_streaming 是基础女声；想要更年轻活力的可换 BV700_streaming（聪明青年女声）
    this.defaultVoice = opts.defaultVoice ?? process.env.BYTEDANCE_TTS_VOICE ?? "BV700_streaming";
  }

  async synthesize(input: TtsInput, outDir: string, fileBase: string): Promise<TtsResult> {
    await mkdir(outDir, { recursive: true });

    const payload = {
      app: { appid: this.appid, token: this.accessToken, cluster: this.cluster },
      user: { uid: "solo-comic-studio" },
      audio: {
        voice_type: input.voice ?? this.defaultVoice,
        encoding: "mp3",
        speed_ratio: input.speed ?? 1.0,
        emotion: input.emotion ?? "neutral"
      },
      request: {
        reqid: randomUUID(),
        text: input.text,
        operation: "query",
        with_frontend: 1,
        frontend_type: "unitTson"
      }
    };

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer;${this.accessToken}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`bytedance tts http ${res.status}: ${text.slice(0, 400)}`);
    }
    const json = (await res.json()) as TtsResponse;
    if (json.code && json.code !== 3000) {
      throw new Error(`bytedance tts error ${json.code}: ${json.message ?? "unknown"}`);
    }
    if (!json.data) throw new Error("bytedance tts response missing audio");

    const buffer = Buffer.from(json.data, "base64");
    const filename = `${fileBase}.mp3`;
    const filePath = path.join(outDir, filename);
    await writeFile(filePath, buffer);

    const durationMs = json.duration ? Number(json.duration) : Math.round((input.text.length / 5) * 1000);
    return {
      url: `/generated/${path.basename(outDir)}/${filename}`,
      localPath: filePath,
      durationMs,
      provider: "bytedance"
    };
  }
}
