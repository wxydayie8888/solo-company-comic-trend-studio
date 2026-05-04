import { NextResponse } from "next/server";
import { fetchHotTopicsDetailed } from "@/lib/server/hotTopicFetcher";
import { writeJson } from "@/lib/server/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  try {
    const { topics, perPlatform } = await fetchHotTopicsDetailed(3);
    const fetchedAt = new Date().toISOString();

    if (topics.length === 0) {
      const allFailed = perPlatform.every((p) => !p.ok);
      const message = allFailed
        ? "所有平台都抓取失败。检查 docker compose ps 看 xhs-toolkit / trend-radar 是否在跑，或确认 HOT_API_BASE 可达。"
        : "所有平台返回空数据。可能是上游接口结构变化，请查看 docs/hot-topics.md 排错。";
      return NextResponse.json({ error: message, perPlatform }, { status: 502 });
    }

    await writeJson("topics.json", topics);
    await writeJson("topics-fetched-at.json", { at: fetchedAt, count: topics.length });

    return NextResponse.json({ topics, fetchedAt, perPlatform });
  } catch (err) {
    return NextResponse.json({ error: `抓取失败：${(err as Error).message}` }, { status: 500 });
  }
}
