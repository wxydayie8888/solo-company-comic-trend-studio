import { NextResponse } from "next/server";
import { fetchHotTopics } from "@/lib/server/hotTopicFetcher";
import { writeJson } from "@/lib/server/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  try {
    const topics = await fetchHotTopics(3);
    if (topics.length === 0) {
      return NextResponse.json(
        {
          error:
            "未抓到任何热点。可能原因：1) 当前网络无法访问 HOT_API_BASE（默认 api-hot.imsyy.top）；2) 上游 API 临时故障。请检查终端日志，或在 .env.local 配置 HOT_API_BASE 为可达的镜像。"
        },
        { status: 502 }
      );
    }
    await writeJson("topics.json", topics);
    await writeJson("topics-fetched-at.json", { at: new Date().toISOString(), count: topics.length });
    return NextResponse.json({ topics, fetchedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { error: `抓取失败：${(err as Error).message}` },
      { status: 500 }
    );
  }
}
