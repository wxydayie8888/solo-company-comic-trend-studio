"use client";

import { Loader2, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { ContentThesis, HotTopic, ScriptSegment } from "@/lib/types";

export interface TheoryMatch {
  theoryId: string;
  fit: number;
  reason: string;
  caution: string;
}

interface Props {
  selectedTopicId: string;
  selectedTheoryId: string;
  onTopicsRefreshed: (topics: HotTopic[]) => void;
  onScriptRewritten: (thesis: ContentThesis, segments: ScriptSegment[]) => void;
  onTheoryMatchesUpdated: (matches: TheoryMatch[]) => void;
}

interface HealthInfo {
  aiEnabled: boolean;
  topicsFetchedAt?: string;
}

async function getHealth(): Promise<HealthInfo> {
  try {
    const res = await fetch("/api/health", { cache: "no-store" });
    if (!res.ok) return { aiEnabled: false };
    return (await res.json()) as HealthInfo;
  } catch {
    return { aiEnabled: false };
  }
}

export function LiveControls({
  selectedTopicId,
  selectedTheoryId,
  onTopicsRefreshed,
  onScriptRewritten,
  onTheoryMatchesUpdated
}: Props) {
  const [busy, setBusy] = useState<null | "topics" | "script" | "theory">(null);
  const [health, setHealth] = useState<HealthInfo>({ aiEnabled: false });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHealth().then((h) => {
      if (!cancelled) setHealth(h);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function flash(msg: string) {
    setMessage(msg);
    window.setTimeout(() => setMessage(null), 4000);
  }

  async function refreshTopics() {
    setBusy("topics");
    try {
      const res = await fetch("/api/topics/refresh", { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { topics: HotTopic[]; fetchedAt: string };
      onTopicsRefreshed(data.topics);
      flash(`已抓 ${data.topics.length} 条热点（${new Date(data.fetchedAt).toLocaleTimeString("zh-CN")}）`);
      setHealth((h) => ({ ...h, topicsFetchedAt: data.fetchedAt }));
    } catch (err) {
      flash(`抓取失败：${(err as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  async function rewriteScript() {
    setBusy("script");
    try {
      const res = await fetch("/api/script/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId: selectedTopicId, theoryId: selectedTheoryId })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { thesis: ContentThesis; segments: ScriptSegment[]; aiUsed: boolean };
      onScriptRewritten(data.thesis, data.segments);
      flash(data.aiUsed ? "Claude 已重写脚本" : "未配置 API Key，使用本地模板生成");
    } catch (err) {
      flash(`脚本生成失败：${(err as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  async function rerankTheories() {
    setBusy("theory");
    try {
      const res = await fetch("/api/theory/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId: selectedTopicId })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { matches: TheoryMatch[] };
      onTheoryMatchesUpdated(data.matches);
      flash(`AI 推荐 ${data.matches.length} 个理论`);
    } catch (err) {
      flash(`理论匹配失败：${(err as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="live-controls">
      <div className="live-controls-status">
        <span className={health.aiEnabled ? "dot dot-green" : "dot dot-amber"} />
        {health.aiEnabled ? "AI 已启用（Claude）" : "仅模板模式（未设置 ANTHROPIC_API_KEY）"}
        {health.topicsFetchedAt ? <em> · 上次抓取 {new Date(health.topicsFetchedAt).toLocaleString("zh-CN")}</em> : null}
      </div>
      <div className="live-controls-buttons">
        <button onClick={refreshTopics} disabled={busy !== null} type="button">
          {busy === "topics" ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
          刷新今日热点
        </button>
        <button onClick={rerankTheories} disabled={busy !== null} type="button">
          {busy === "theory" ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
          AI 推荐理论
        </button>
        <button onClick={rewriteScript} disabled={busy !== null} type="button">
          {busy === "script" ? <Loader2 size={14} className="spin" /> : <Wand2 size={14} />}
          AI 重写脚本
        </button>
      </div>
      {message ? <div className="live-controls-flash">{message}</div> : null}
    </div>
  );
}
