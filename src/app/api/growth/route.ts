import { NextResponse } from "next/server";
import { growthMetrics as seedMetrics } from "@/lib/seed";
import { readJson, writeJson } from "@/lib/server/store";
import type { GrowthMetric } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const stored = await readJson<GrowthMetric[]>("growth_metrics.json", []);
  const metrics = stored.length > 0 ? stored : seedMetrics;
  return NextResponse.json({ metrics, source: stored.length > 0 ? "live" : "seed" });
}

// 接受批量导入（手动 CSV 导入或 cron 从平台 API 拉回数据后调用）
export async function POST(req: Request) {
  const body = (await req.json()) as { metrics: GrowthMetric[]; merge?: boolean };
  if (!Array.isArray(body.metrics)) {
    return NextResponse.json({ error: "metrics array required" }, { status: 400 });
  }
  const existing = body.merge ? await readJson<GrowthMetric[]>("growth_metrics.json", []) : [];
  const merged = mergeMetrics([...existing, ...body.metrics]);
  await writeJson("growth_metrics.json", merged);
  return NextResponse.json({ ok: true, count: merged.length });
}

function mergeMetrics(items: GrowthMetric[]): GrowthMetric[] {
  // 按 date+platform+title 去重，保留最新
  const map = new Map<string, GrowthMetric>();
  for (const m of items) {
    map.set(`${m.date}|${m.platform}|${m.title}`, m);
  }
  return Array.from(map.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
}
