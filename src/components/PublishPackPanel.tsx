"use client";

import { Clipboard, ExternalLink, Megaphone, Play, Rocket, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Platform, PlatformDraft } from "@/lib/types";

interface Props {
  drafts: PlatformDraft[];
  generatedVideoUrl: string | null;
  isUnlocked: boolean;
  topicId: string;
  theoryId: string;
  episodeId: string;
  episodeTitle: string;
}

export function PublishPackPanel({
  drafts,
  generatedVideoUrl,
  isUnlocked,
  topicId,
  theoryId,
  episodeId,
  episodeTitle
}: Props) {
  const [preparedPlatforms, setPreparedPlatforms] = useState<Partial<Record<Platform, string>>>({});
  const [busy, setBusy] = useState<Platform | "all" | null>(null);

  async function logPublish(draft: PlatformDraft) {
    try {
      const res = await fetch("/api/publish/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: draft.platform,
          title: draft.titleA || episodeTitle,
          body: draft.body,
          hashtags: draft.hashtags,
          videoUrl: generatedVideoUrl ?? "",
          topicId,
          theoryId,
          episodeId
        })
      });
      if (!res.ok) return null;
      return (await res.json()) as { provider: string; status: string; message?: string };
    } catch {
      return null;
    }
  }

  async function prepareAllPlatforms() {
    if (!isUnlocked) return;
    setBusy("all");
    const pack = drafts.map(formatDraftForClipboard).join("\n\n---\n\n");
    try {
      await navigator.clipboard.writeText(`四平台分发包\n\n${pack}\n\n视频文件：请点击本页"下载视频文件"后上传。`);
    } catch {
      // copy failed; fallthrough to log + open
    }
    const results = await Promise.all(drafts.map((d) => logPublish(d)));
    setPreparedPlatforms(
      drafts.reduce<Partial<Record<Platform, string>>>((result, draft, idx) => {
        const r = results[idx];
        result[draft.platform] = r
          ? `已通过 ${r.provider} ${r.status === "manual" ? "（手动模式）" : ""}写入日志，发布入口已打开`
          : "发布入口已打开（写入日志失败）";
        return result;
      }, {})
    );
    drafts.forEach((draft, index) => {
      window.setTimeout(() => window.open(draft.publishUrl, "_blank", "noopener,noreferrer"), index * 180);
    });
    setBusy(null);
  }

  async function preparePublish(draft: PlatformDraft) {
    if (!isUnlocked) return;
    setBusy(draft.platform);
    const copy = formatDraftForClipboard(draft);
    try {
      await navigator.clipboard.writeText(copy);
    } catch {
      // ignore
    }
    const r = await logPublish(draft);
    setPreparedPlatforms((current) => ({
      ...current,
      [draft.platform]: r
        ? `${r.provider} · ${r.status === "manual" ? "手动模式" : r.status} · 发布入口已打开`
        : "发布入口已打开（日志写入失败）"
    }));
    window.open(draft.publishUrl, "_blank", "noopener,noreferrer");
    setBusy(null);
  }

  return (
    <section className={`work-panel publish-panel ${!isUnlocked ? "locked-step" : ""}`}>
      <div className="section-heading">
        <div>
          <span className="kicker">07 一键发布准备</span>
          <h2>复制文案、打开入口、上传短片</h2>
        </div>
        <Megaphone size={20} />
      </div>
      <div className={`step-callout ${isUnlocked ? "ready" : "locked"}`}>
        {isUnlocked
          ? "视频已生成。你可以一键复制四平台分发包并打开四个平台发布入口，最终提交前仍请人工确认。"
          : "先生成短片，再准备四平台发布。"}
      </div>
      <div className="distribution-bar">
        <div>
          <b>四平台分发总控</b>
          <p>{generatedVideoUrl ? "先下载视频文件，再点击总按钮复制文案并打开发布入口。" : "生成短片后，这里会解锁分发动作。"}</p>
        </div>
        <button className="primary-action" disabled={!isUnlocked || busy !== null} onClick={prepareAllPlatforms} type="button">
          <Rocket size={17} />
          {busy === "all" ? "正在准备 4 平台..." : "一键准备四平台分发"}
        </button>
      </div>
      <div className="draft-list">
        {drafts.map((draft) => (
          <article className="draft-card" key={draft.platform}>
            <div className="draft-heading">
              <h3>{draft.platform}</h3>
              <span>{draft.status === "ready-for-human" ? "待人审发布" : "草稿"}</span>
            </div>
            <div className="draft-title">
              <p>{draft.titleA}</p>
              <small>{draft.titleB}</small>
            </div>
            <p className="draft-body">{draft.body}</p>
            <div className="platform-score">
              {Object.entries(draft.score).map(([key, value]) => (
                <div key={key}>
                  <span>{scoreLabel[key] ?? key}</span>
                  <b>{value}</b>
                </div>
              ))}
            </div>
            <div className="tag-row">
              {draft.hashtags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
            <div className="constraint">
              <Play size={15} />
              {draft.constraints}
            </div>
            <div className="checkline">
              <ShieldCheck size={15} />
              {draft.checklist[0]}
            </div>
            <button className="publish-action" disabled={!isUnlocked || busy !== null} onClick={() => preparePublish(draft)} type="button">
              <Clipboard size={16} />
              {busy === draft.platform ? `正在准备${draft.platform}...` : `一键准备${draft.platform}发布`}
              <ExternalLink size={16} />
            </button>
            {preparedPlatforms[draft.platform] ? <p className="publish-status">{preparedPlatforms[draft.platform]}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

const scoreLabel: Record<string, string> = {
  titlePower: "标题",
  saveValue: "收藏",
  commentTrigger: "评论",
  compliance: "合规",
  coverFit: "封面"
};

function formatDraftForClipboard(draft: PlatformDraft) {
  return [
    `【${draft.platform}】`,
    `标题 A：${draft.titleA}`,
    `标题 B：${draft.titleB}`,
    "",
    draft.body,
    "",
    `话题：${draft.hashtags.map((tag) => `#${tag}`).join(" ")}`,
    `置顶评论：${draft.pinnedComment}`,
    "视频文件：请下载本页生成的视频后上传。",
    `发布入口：${draft.publishUrl}`
  ].join("\n");
}
