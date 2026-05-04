import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

let client: Anthropic | null = null;

export function isAiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient(): Anthropic {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not set");
    }
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export interface AskOptions {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}

export async function askJson<T>(opts: AskOptions): Promise<T> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 2048,
    temperature: opts.temperature ?? 0.7,
    system: `${opts.system}\n\n严格只输出一段 JSON，不要 Markdown 代码块、不要解释文字。`,
    messages: [{ role: "user", content: opts.user }]
  });
  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Empty Claude response");
  }
  const text = block.text.trim();
  const jsonStart = text.indexOf("{");
  const arrStart = text.indexOf("[");
  const start = jsonStart === -1 ? arrStart : arrStart === -1 ? jsonStart : Math.min(jsonStart, arrStart);
  if (start === -1) throw new Error(`Claude did not return JSON: ${text.slice(0, 120)}`);
  const jsonText = text.slice(start);
  return JSON.parse(jsonText) as T;
}
