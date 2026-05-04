import { signVolcengine } from "./volcengineSign";

const HOST = "visual.volcengineapi.com";
const SERVICE = "cv";
const REGION = "cn-north-1";
const VERSION = "2022-08-31";

export interface JimengVideoSubmitInput {
  prompt: string;
  imageUrl?: string;
  aspectRatio?: "9:16" | "16:9" | "1:1";
  seed?: number;
  reqKey?: string;
}

interface JimengEnvelope<T> {
  code?: number;
  message?: string;
  data?: T;
}

interface SubmitData {
  task_id: string;
}

interface ResultData {
  status?: "in_queue" | "generating" | "done" | "failed";
  video_url?: string;
  message?: string;
}

export class JimengVideoProvider {
  name = "jimeng-video";
  private ak: string;
  private sk: string;
  private reqKey: string;

  constructor(opts: { ak: string; sk: string; reqKey?: string }) {
    this.ak = opts.ak;
    this.sk = opts.sk;
    // 文生视频 720P：jimeng_vgfm_t2v_l20；图生视频：jimeng_vgfm_i2v_l20
    this.reqKey = opts.reqKey ?? process.env.JIMENG_VIDEO_REQ_KEY ?? "jimeng_vgfm_t2v_l20";
  }

  async submit(input: JimengVideoSubmitInput): Promise<string> {
    const reqKey = input.imageUrl ? this.reqKey.replace("t2v", "i2v") : this.reqKey;
    const payload: Record<string, unknown> = {
      req_key: reqKey,
      prompt: input.prompt,
      seed: input.seed ?? -1,
      aspect_ratio: input.aspectRatio ?? "9:16"
    };
    if (input.imageUrl) payload.image_urls = [input.imageUrl];

    const signed = signVolcengine({
      method: "POST",
      host: HOST,
      path: "/",
      query: { Action: "CVSync2AsyncSubmitTask", Version: VERSION },
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      service: SERVICE,
      region: REGION,
      ak: this.ak,
      sk: this.sk
    });
    const res = await fetch(signed.url, { method: "POST", headers: signed.headers, body: signed.body });
    if (!res.ok) throw new Error(`jimeng video submit http ${res.status}: ${(await res.text()).slice(0, 400)}`);
    const json = (await res.json()) as JimengEnvelope<SubmitData>;
    if (json.code !== 10000 || !json.data?.task_id) {
      throw new Error(`jimeng video submit failed: ${json.message ?? "no task_id"}`);
    }
    return json.data.task_id;
  }

  async fetchResult(taskId: string): Promise<ResultData> {
    const signed = signVolcengine({
      method: "POST",
      host: HOST,
      path: "/",
      query: { Action: "CVSync2AsyncGetResult", Version: VERSION },
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ req_key: this.reqKey, task_id: taskId }),
      service: SERVICE,
      region: REGION,
      ak: this.ak,
      sk: this.sk
    });
    const res = await fetch(signed.url, { method: "POST", headers: signed.headers, body: signed.body });
    if (!res.ok) throw new Error(`jimeng video result http ${res.status}: ${(await res.text()).slice(0, 400)}`);
    const json = (await res.json()) as JimengEnvelope<ResultData>;
    if (json.code !== 10000) throw new Error(`jimeng video result failed: ${json.message ?? "unknown"}`);
    return json.data ?? {};
  }

  async waitForResult(taskId: string, opts?: { intervalMs?: number; timeoutMs?: number }): Promise<string> {
    const interval = opts?.intervalMs ?? 8000;
    const timeout = opts?.timeoutMs ?? 5 * 60 * 1000;
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const result = await this.fetchResult(taskId);
      if (result.status === "done" && result.video_url) return result.video_url;
      if (result.status === "failed") throw new Error(`jimeng video task failed: ${result.message ?? "unknown"}`);
      await new Promise((r) => setTimeout(r, interval));
    }
    throw new Error(`jimeng video task timeout after ${timeout}ms`);
  }
}
