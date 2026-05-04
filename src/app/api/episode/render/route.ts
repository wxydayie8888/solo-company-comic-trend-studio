import { NextResponse } from "next/server";
import { renderEpisode } from "@/lib/server/pipeline/renderEpisode";
import type { Episode } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  const body = (await req.json()) as { episode?: Episode };
  if (!body.episode) {
    return NextResponse.json({ error: "episode body required" }, { status: 400 });
  }
  try {
    const result = await renderEpisode(body.episode);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
