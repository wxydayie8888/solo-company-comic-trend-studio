import { AlertTriangle, BarChart3, CheckCircle2, Gauge, ListChecks } from "lucide-react";
import { Episode, GrowthSummary, WorkflowStatus } from "@/lib/types";

type WorkflowStep = "topic" | "theory" | "script" | "storyboard" | "video" | "publish";

const workflowLabel = {
  topic: "选题",
  theory: "理论",
  script: "脚本",
  storyboard: "分镜",
  video: "短片",
  publish: "发布"
};

const statusLabel = {
  "not-started": "未开始",
  "needs-human": "待人审",
  approved: "已确认",
  blocked: "阻断"
};

export function GrowthReviewPanel({
  activeStep,
  episode,
  growth,
  nextStepLabel,
  workflow
}: {
  activeStep: WorkflowStep;
  episode: Episode;
  growth: GrowthSummary;
  nextStepLabel: string;
  workflow: Record<WorkflowStep, WorkflowStatus>;
}) {
  const completedSteps = Object.values(workflow).filter((status) => status === "approved").length;
  const progress = Math.round((completedSteps / Object.keys(workflow).length) * 100);

  return (
    <aside className="side-rail">
      <section className="work-panel ops-panel sticky-panel">
        <div className="section-heading">
          <div>
            <span className="kicker">今日状态</span>
            <h2>发布准备度</h2>
          </div>
          <Gauge size={20} />
        </div>
        <div className={`review-banner ${episode.reviewStatus}`}>
          {episode.reviewStatus === "ready" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          {episode.reviewStatus === "ready" ? "可以进入人工预览" : episode.reviewStatus === "blocked" ? "暂不发布" : "需要人工复核"}
        </div>
        <div className="next-step-card">
          <span>今日下一步</span>
          <strong>{nextStepLabel}</strong>
        </div>
        <div className="progress-card" aria-label={`生产进度 ${progress}%`}>
          <div>
            <span>生产进度</span>
            <b>{progress}%</b>
          </div>
          <div className="progress-track">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="workflow-list">
          {Object.entries(workflow).map(([key, value]) => (
            <div className={key === activeStep ? "current" : ""} key={key}>
              <span>{workflowLabel[key as keyof typeof workflowLabel]}</span>
              <b>{statusLabel[value]}</b>
            </div>
          ))}
        </div>
        {episode.reviewWarnings.length > 0 ? (
          <div className="warning-box">
            <AlertTriangle size={18} />
            <p>红灯项：{episode.reviewWarnings.join("、")}。发布前必须改写或补证据。</p>
          </div>
        ) : (
          <div className="safe-box">
            <CheckCircle2 size={18} />
            <p>当前选题无红灯项，可以进入人工预览。</p>
          </div>
        )}
      </section>

      <section className="work-panel ops-panel">
        <div className="section-heading">
          <div>
            <span className="kicker">复盘反哺</span>
            <h2>下一条怎么更好</h2>
          </div>
          <BarChart3 size={20} />
        </div>
        <dl className="metric-grid">
          <div>
            <dt>播放</dt>
            <dd>{formatNumber(growth.totalViews)}</dd>
          </div>
          <div>
            <dt>完播</dt>
            <dd>{growth.avgCompletion}%</dd>
          </div>
          <div>
            <dt>收藏</dt>
            <dd>{formatNumber(growth.totalSaves)}</dd>
          </div>
          <div>
            <dt>评论率</dt>
            <dd>{growth.commentRate}%</dd>
          </div>
        </dl>
        <div className="insight-list">
          {growth.insights.map((insight) => (
            <article className={`insight ${insight.priority}`} key={insight.signal}>
              <h3>
                <ListChecks size={15} />
                {insight.signal}
              </h3>
              <p>{insight.nextMove}</p>
            </article>
          ))}
        </div>
        <div className="keyword-row">
          {growth.topKeywords.map((keyword) => (
            <span key={keyword}>{keyword}</span>
          ))}
        </div>
      </section>
    </aside>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}
