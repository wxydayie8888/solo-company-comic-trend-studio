"use client";

import { Clipboard, ExternalLink, Megaphone, Play, Rocket, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Platform, PlatformDraft } from "@/lib/types";

export function PublishPackPanel({ drafts, generatedVideoUrl, isUnlocked }: { drafts: PlatformDraft[]; generatedVideoUrl: string | null; isUnlocked: boolean }) {
  const [preparedPlatforms, setPreparedPlatforms] = useState<Partial<Record<Platform, string>>>({});

  async function prepareAllPlatforms() {
    if (!isUnlocked) return;
    const pack = drafts.map(formatDraftForClipboard).join("\n\n---\n\n");
    try {
      await navigator.clipboard.writeText(`四平台分发包\n\n${pack}\n\n视频文件：请点击本页“下载视频文件”后上传。`);
      setPreparedPlatforms(
        drafts.reduce<Partial<Record<Platform, string>>>((result, draft) => {
          result[draft.platform] = "四平台分发包已复制，发布入口已打开";
          return result;
        }, {})
      );
    } catch {
      setPreparedPlatforms(
        drafts.reduce<Partial<Record<Platform, string>>>((result, draft) => {
          result[draft.platform] = "发布入口已打开；浏览器禁止复制时请手动复制文案";
          return result;
        }, {})
      );
    }
    drafts.forEach((draft, index) => {
      window.setTimeout(() => window.open(draft.publishUrl, "_blank", "noopener,noreferrer"), index * 180);
    });
  }

  async function preparePublish(draft: PlatformDraft) {
    if (!isUnlocked) return;
    const copy = formatDraftForClipboard(draft);

    try {
      await navigator.clipboard.writeText(copy);
      setPreparedPlatforms((current) => ({ ...current, [draft.platform]: "文案已复制，发布入口已打开" }));
    } catch {
      setPreparedPlatforms((current) => ({ ...current, [draft.platform]: "浏览器禁止复制，请手动复制文案" }));
    }
    window.open(draft.publishUrl, "_blank", "noopener,noreferrer");
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
        <button className="primary-action" disabled={!isUnlocked} onClick={prepareAllPlatforms} type="button">
          <Rocket size={17} />
          一键准备四平台分发
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
            <button className="publish-action" disabled={!isUnlocked} onClick={() => preparePublish(draft)} type="button">
              <Clipboard size={16} />
              一键准备{draft.platform}发布
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
