import { ArrowRight, CheckCircle2, Edit3 } from "lucide-react";
import { Episode, ScriptSegmentId } from "@/lib/types";

export function ScriptWorkspace({
  episode,
  isActive,
  isConfirmed,
  isUnlocked,
  onConfirm,
  onSegmentChange
}: {
  episode: Episode;
  isActive: boolean;
  isConfirmed: boolean;
  isUnlocked: boolean;
  onConfirm: () => void;
  onSegmentChange: (segmentId: ScriptSegmentId, text: string) => void;
}) {
  return (
    <section className={`work-panel script-workspace ${isActive ? "active-step" : ""} ${!isUnlocked ? "locked-step" : ""} ${isConfirmed ? "confirmed-step" : ""}`}>
      <div className="section-heading">
        <div>
          <span className="kicker">04 脚本改稿</span>
          <h2>每一段都能改，不让 AI 一口气糊过去</h2>
        </div>
        <Edit3 size={20} />
      </div>
      <div className={`step-callout ${isUnlocked ? "ready" : "locked"}`}>
        {isConfirmed
          ? "脚本已确认。分镜已使用当前脚本文案重新生成。"
          : isUnlocked
            ? "理论已确认。现在可以直接修改六段脚本文案，改完后确认进入分镜审片。"
            : "先确认理论，再进入脚本改稿。"}
      </div>
      <div className="script-grid">
        {episode.scriptSegments.map((segment) => (
          <article className={`script-segment ${segment.status}`} key={segment.id}>
            <div className="script-head">
              <span>{segment.label}</span>
              <b>{isConfirmed ? "已确认" : segment.status === "approved" ? "已过" : segment.status === "blocked" ? "阻断" : "可编辑"}</b>
            </div>
            <h3>{segment.goal}</h3>
            <textarea
              aria-label={`${segment.label}脚本文案`}
              disabled={!isUnlocked}
              onChange={(event) => onSegmentChange(segment.id, event.target.value)}
              rows={5}
              value={segment.text}
            />
            <small>风险提示：{segment.riskHint}</small>
            <div className="alt-row">
              {segment.alternatives.slice(0, 2).map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
      <div className={`confirm-box script-confirm ${isConfirmed ? "confirmed" : ""}`}>
        <div>
          <b>{isConfirmed ? "脚本已确认" : "确认脚本后，进入分镜审片"}</b>
          <p>{isUnlocked ? "确认会把当前六段文案送入分镜区，后续分镜旁白会跟随你的改稿。" : "脚本区仍锁定，请先确认理论。"}</p>
        </div>
        <button className="primary-action" disabled={!isUnlocked} onClick={onConfirm} type="button">
          {isConfirmed ? "重新进入分镜" : "确认脚本，进入分镜审片"}
          {isConfirmed ? <CheckCircle2 size={17} /> : <ArrowRight size={17} />}
        </button>
      </div>
    </section>
  );
}
