"use client";

import { Flame, MessageCircle, Sparkles, Star, Bookmark, ShieldAlert } from "lucide-react";
import { getTopicDecision } from "@/lib/pipeline";
import { HotTopic } from "@/lib/types";

interface TopicDecisionPanelProps {
  topics: HotTopic[];
  selectedTopicId: string;
  onSelect: (topic: HotTopic) => void;
}

const signalLabels = [
  { key: "accountFit", label: "账号适配", icon: Star },
  { key: "novelty", label: "反常识", icon: Sparkles },
  { key: "saveValue", label: "收藏价值", icon: Bookmark },
  { key: "commentPotential", label: "评论潜力", icon: MessageCircle },
  { key: "brandRisk", label: "品牌风险", icon: ShieldAlert }
] as const;

export function TopicDecisionPanel({ onSelect, selectedTopicId, topics }: TopicDecisionPanelProps) {
  const rankedTopics = [...topics].sort((a, b) => getTopicDecision(b).score - getTopicDecision(a).score);

  return (
    <section className="work-panel topic-decision">
      <div className="section-heading">
        <div>
          <span className="kicker">01 选题决策</span>
          <h2>今天只选一个值得做的热点</h2>
        </div>
        <Flame size={20} />
      </div>
      <div className="topic-list">
        {rankedTopics.map((topic) => {
          const decision = getTopicDecision(topic);
          const active = topic.id === selectedTopicId;

          return (
            <button className={`topic-card ${active ? "active" : ""}`} key={topic.id} onClick={() => onSelect(topic)} type="button">
              <div className="topic-topline">
                <span>{topic.platform}</span>
                <strong>{decision.score}</strong>
              </div>
              <h3>{topic.title}</h3>
              <p>{topic.summary}</p>
              <div className="topic-meta">
                <span>热度 {topic.heat}</span>
                <span>情绪 {topic.emotion}</span>
                <span>{decision.grade}</span>
              </div>
              <div className="signal-grid">
                {signalLabels.map(({ icon: Icon, key, label }) => (
                  <div className="signal" key={key}>
                    <span>
                      <Icon size={13} />
                      {label}
                    </span>
                    <b>{topic.signals[key]}</b>
                  </div>
                ))}
              </div>
              <div className="decision-copy">
                <p>{decision.recommendation}</p>
                <small>放弃理由：{decision.rejectReason}</small>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
