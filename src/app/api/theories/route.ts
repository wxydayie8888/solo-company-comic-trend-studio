import { NextResponse } from "next/server";
import { theoryCards as seedTheories } from "@/lib/seed";
import { readJson, writeJson } from "@/lib/server/store";
import { TheoryCard } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const stored = await readJson<TheoryCard[]>("theories.json", []);
  const theories = stored.length > 0 ? stored : seedTheories;
  return NextResponse.json({ theories, source: stored.length > 0 ? "live" : "seed" });
}

export async function POST(req: Request) {
  const body = (await req.json()) as { theory: TheoryCard };
  if (!body.theory?.id) return NextResponse.json({ error: "theory.id required" }, { status: 400 });
  const stored = await readJson<TheoryCard[]>("theories.json", []);
  const base = stored.length > 0 ? stored : seedTheories;
  const filtered = base.filter((t) => t.id !== body.theory.id);
  const next = [...filtered, body.theory];
  await writeJson("theories.json", next);
  return NextResponse.json({ ok: true, count: next.length });
}
