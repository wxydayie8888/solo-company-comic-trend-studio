import { NextResponse } from "next/server";
import { fetchHotTopics } from "@/lib/server/hotTopicFetcher";
import { writeJson } from "@/lib/server/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  try {
    const topics = await fetchHotTopics(3);
    if (topics.length === 0) {
      return NextResponse.json({ error: "no topics fetched" }, { status: 502 });
    }
    await writeJson("topics.json", topics);
    await writeJson("topics-fetched-at.json", { at: new Date().toISOString(), count: topics.length });
    return NextResponse.json({ topics, fetchedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
