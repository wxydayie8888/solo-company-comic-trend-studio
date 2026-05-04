import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ImageGenInput, ImageGenResult, ImageProvider } from "./types";
import { signVolcengine } from "./volcengineSign";

const HOST = "visual.volcengineapi.com";
const SERVICE = "cv";
const REGION = "cn-north-1";
const VERSION = "2022-08-31";

interface JimengResponse {
  code?: number;
  message?: string;
  request_id?: string;
  data?: {
    image_urls?: string[];
    binary_data_base64?: string[];
    algorithm_base_resp?: { status_code?: number; status_message?: string };
  };
}

export class JimengImageProvider implements ImageProvider {
  name = "jimeng";
  private ak: string;
  private sk: string;
  private reqKey: string;

  constructor(opts: { ak: string; sk: string; reqKey?: string }) {
    this.ak = opts.ak;
    this.sk = opts.sk;
    // jimeng_t2i_v31 是 2025 主力（文字稳定、海报场景增强）；可换 jimeng_t2i_v30
    this.reqKey = opts.reqKey ?? process.env.JIMENG_IMAGE_REQ_KEY ?? "jimeng_t2i_v31";
  }

  async generate(input: ImageGenInput, outDir: string, fileBase: string): Promise<ImageGenResult> {
    await mkdir(outDir, { recursive: true });

    const body = JSON.stringify({
      req_key: this.reqKey,
      prompt: input.prompt,
      width: input.width ?? 1024,
      height: input.height ?? 1024,
      seed: input.seed ?? -1,
      scale: 2.5,
      use_pre_llm: true,
      use_sr: true,
      return_url: false // base64，避免 24h 过期问题
    });

    const signed = signVolcengine({
      method: "POST",
      host: HOST,
      path: "/",
      query: { Action: "CVProcess", Version: VERSION },
      headers: { "Content-Type": "application/json" },
      body,
      service: SERVICE,
      region: REGION,
      ak: this.ak,
      sk: this.sk
    });

    const res = await fetch(signed.url, {
      method: "POST",
      headers: signed.headers,
      body: signed.body
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`jimeng http ${res.status}: ${text.slice(0, 400)}`);
    }
    const json = (await res.json()) as JimengResponse;
    if (json.code !== 10000 && json.data?.algorithm_base_resp?.status_code !== 0) {
      throw new Error(`jimeng error ${json.code}: ${json.message ?? json.data?.algorithm_base_resp?.status_message ?? "unknown"}`);
    }

    let buffer: Buffer;
    if (json.data?.binary_data_base64?.[0]) {
      buffer = Buffer.from(json.data.binary_data_base64[0], "base64");
    } else if (json.data?.image_urls?.[0]) {
      const imgRes = await fetch(json.data.image_urls[0]);
      if (!imgRes.ok) throw new Error(`download image http ${imgRes.status}`);
      buffer = Buffer.from(await imgRes.arrayBuffer());
    } else {
      throw new Error("jimeng response missing image data");
    }

    const filename = `${fileBase}.png`;
    const filePath = path.join(outDir, filename);
    await writeFile(filePath, buffer);

    return {
      url: `/generated/${path.basename(outDir)}/${filename}`,
      localPath: filePath,
      provider: "jimeng",
      promptUsed: input.prompt
    };
  }
}
