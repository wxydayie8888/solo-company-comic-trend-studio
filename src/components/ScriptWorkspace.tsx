import { Edit3 } from "lucide-react";
import { Episode } from "@/lib/types";

export function ScriptWorkspace({ episode }: { episode: Episode }) {
  return (
    <section className="work-panel script-workspace">
      <div className="section-heading">
        <div>
          <span className="kicker">04 脚本改稿</span>
          <h2>每一段都能改，不让 AI 一口气糊过去</h2>
        </div>
        <Edit3 size={20} />
      </div>
      <div className="script-grid">
        {episode.scriptSegments.map((segment) => (
          <article className={`script-segment ${segment.status}`} key={segment.id}>
            <div className="script-head">
              <span>{segment.label}</span>
              <b>{segment.status === "approved" ? "已过" : segment.status === "blocked" ? "阻断" : "待人审"}</b>
            </div>
            <h3>{segment.goal}</h3>
            <p>{segment.text}</p>
            <small>风险提示：{segment.riskHint}</small>
            <div className="alt-row">
              {segment.alternatives.slice(0, 2).map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
