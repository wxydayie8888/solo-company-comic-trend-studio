import { Megaphone, Play, ShieldCheck } from "lucide-react";
import { PlatformDraft } from "@/lib/types";

export function PublishPackPanel({ drafts }: { drafts: PlatformDraft[] }) {
  return (
    <section className="work-panel publish-panel">
      <div className="section-heading">
        <div>
          <span className="kicker">06 发布检查</span>
          <h2>四平台发布包和适配评分</h2>
        </div>
        <Megaphone size={20} />
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
