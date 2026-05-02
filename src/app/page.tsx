"use client";

import { LayoutDashboard, TimerReset } from "lucide-react";
import { useMemo, useState } from "react";
import { DirectorStoryboard } from "@/components/DirectorStoryboard";
import { GrowthReviewPanel } from "@/components/GrowthReviewPanel";
import { PublishPackPanel } from "@/components/PublishPackPanel";
import { ResearchPacketPanel } from "@/components/ResearchPacketPanel";
import { ScriptWorkspace } from "@/components/ScriptWorkspace";
import { TheoryLabPanel } from "@/components/TheoryLabPanel";
import { TopicDecisionPanel } from "@/components/TopicDecisionPanel";
import { createEpisode, createPlatformDrafts, matchTheories, summarizeGrowth } from "@/lib/pipeline";
import { growthMetrics, hotTopics, researchPackets, theoryCards } from "@/lib/seed";
import { HotTopic } from "@/lib/types";

export default function Home() {
  const [selectedTopicId, setSelectedTopicId] = useState(hotTopics[0].id);
  const selectedTopic = hotTopics.find((topic) => topic.id === selectedTopicId) ?? hotTopics[0];
  const packet = researchPackets[selectedTopic.id];
  const matchedTheories = useMemo(() => matchTheories(selectedTopic, theoryCards), [selectedTopic]);
  const [selectedTheoryId, setSelectedTheoryId] = useState(matchedTheories[0].id);
  const selectedTheory = matchedTheories.find((theory) => theory.id === selectedTheoryId) ?? matchedTheories[0];
  const episode = useMemo(() => createEpisode(selectedTopic, packet, selectedTheory), [packet, selectedTheory, selectedTopic]);
  const drafts = useMemo(() => createPlatformDrafts(episode), [episode]);
  const growth = useMemo(() => summarizeGrowth(growthMetrics), []);

  function chooseTopic(topic: HotTopic) {
    const theories = matchTheories(topic, theoryCards);
    setSelectedTopicId(topic.id);
    setSelectedTheoryId(theories[0].id);
  }

  return (
    <main>
      <section className="hero-band">
        <div className="shell hero-grid">
          <div>
            <div className="eyebrow">
              <LayoutDashboard size={16} />
              V2 每日内容生产台
            </div>
            <h1>20 分钟，从热点判断到漫画短视频发布包。</h1>
            <p className="hero-copy">
              不是把热点搬运成视频，而是先做判断，再共创论点、改脚本、审分镜、检查发布。工具现在围绕“今天到底值不值得做”来工作。
            </p>
          </div>
          <div className="hero-snapshot" aria-label="今日工作流概览">
            <div className="snapshot-row">
              <span>今日目标</span>
              <strong>选出 1 条可解释、可收藏、可评论的社会生活热点</strong>
            </div>
            <div className="snapshot-row">
              <span>当前论点</span>
              <strong>{episode.thesis.goldenLine}</strong>
            </div>
            <div className="snapshot-row accent">
              <TimerReset size={18} />
              <strong>预计 20 分钟完成人审发布包</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="shell workbench-layout">
        <div className="main-column">
          <TopicDecisionPanel onSelect={chooseTopic} selectedTopicId={selectedTopic.id} topics={hotTopics} />
          <ResearchPacketPanel packet={packet} topic={selectedTopic} />
          <TheoryLabPanel onSelect={setSelectedTheoryId} selectedTheory={selectedTheory} theories={matchedTheories} thesis={episode.thesis} />
          <ScriptWorkspace episode={episode} />
          <DirectorStoryboard episode={episode} />
          <PublishPackPanel drafts={drafts} />
        </div>
        <GrowthReviewPanel episode={episode} growth={growth} />
      </div>
    </main>
  );
}
