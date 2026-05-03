"use client";

import { LayoutDashboard, TimerReset } from "lucide-react";
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DirectorStoryboard } from "@/components/DirectorStoryboard";
import { GrowthReviewPanel } from "@/components/GrowthReviewPanel";
import { PublishPackPanel } from "@/components/PublishPackPanel";
import { ResearchPacketPanel } from "@/components/ResearchPacketPanel";
import { ScriptWorkspace } from "@/components/ScriptWorkspace";
import { TheoryLabPanel } from "@/components/TheoryLabPanel";
import { TopicDecisionPanel } from "@/components/TopicDecisionPanel";
import { VideoStudio } from "@/components/VideoStudio";
import { WorkflowStepper } from "@/components/WorkflowStepper";
import { buildDirectorFrames, createEpisode, createPlatformDrafts, matchTheories, summarizeGrowth } from "@/lib/pipeline";
import { growthMetrics, hotTopics, researchPackets, theoryCards } from "@/lib/seed";
import { HotTopic, ScriptSegment, ScriptSegmentId, WorkflowStatus } from "@/lib/types";

type ActiveStep = "topic" | "theory" | "script" | "storyboard" | "video" | "publish";

export default function Home() {
  const [selectedTopicId, setSelectedTopicId] = useState(hotTopics[0].id);
  const [confirmedTheoryId, setConfirmedTheoryId] = useState<string | null>(null);
  const [isScriptConfirmed, setIsScriptConfirmed] = useState(false);
  const [isStoryboardConfirmed, setIsStoryboardConfirmed] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<ActiveStep>("theory");
  const topicRef = useRef<HTMLDivElement>(null);
  const theoryRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLDivElement>(null);
  const storyboardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const publishRef = useRef<HTMLDivElement>(null);
  const selectedTopic = hotTopics.find((topic) => topic.id === selectedTopicId) ?? hotTopics[0];
  const packet = researchPackets[selectedTopic.id];
  const matchedTheories = useMemo(() => matchTheories(selectedTopic, theoryCards), [selectedTopic]);
  const [selectedTheoryId, setSelectedTheoryId] = useState(matchedTheories[0].id);
  const selectedTheory = matchedTheories.find((theory) => theory.id === selectedTheoryId) ?? matchedTheories[0];
  const isTheoryConfirmed = confirmedTheoryId === selectedTheory.id;
  const episode = useMemo(() => createEpisode(selectedTopic, packet, selectedTheory), [packet, selectedTheory, selectedTopic]);
  const [scriptSegments, setScriptSegments] = useState<ScriptSegment[]>(episode.scriptSegments);
  const editedEpisode = useMemo(
    () => ({
      ...episode,
      scriptSegments,
      storyboard: buildDirectorFrames(selectedTopic, selectedTheory, episode.thesis, scriptSegments, episode.visualIdentity)
    }),
    [episode, scriptSegments, selectedTheory, selectedTopic]
  );
  const drafts = useMemo(() => createPlatformDrafts(editedEpisode), [editedEpisode]);
  const growth = useMemo(() => summarizeGrowth(growthMetrics), []);
  const workflow = useMemo<Record<ActiveStep, WorkflowStatus>>(
    () => ({
      topic: "approved",
      theory: isTheoryConfirmed ? "approved" : "needs-human",
      script: isScriptConfirmed ? "approved" : isTheoryConfirmed ? "needs-human" : "not-started",
      storyboard: isStoryboardConfirmed ? "approved" : isScriptConfirmed ? "needs-human" : "not-started",
      video: generatedVideoUrl ? "approved" : isStoryboardConfirmed ? "needs-human" : "not-started",
      publish: generatedVideoUrl ? "needs-human" : "not-started"
    }),
    [generatedVideoUrl, isScriptConfirmed, isStoryboardConfirmed, isTheoryConfirmed]
  );
  const nextStepLabel = generatedVideoUrl
    ? "下一步：一键准备四平台发布"
    : isStoryboardConfirmed
      ? "下一步：生成短片"
      : isScriptConfirmed
        ? "下一步：审查漫画分镜"
        : isTheoryConfirmed
          ? "下一步：修改并确认脚本"
          : "下一步：确认理论";
  const resetGeneratedVideo = useCallback(() => {
    setGeneratedVideoUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }, []);

  useEffect(() => {
    setScriptSegments(episode.scriptSegments);
    setIsScriptConfirmed(false);
    setIsStoryboardConfirmed(false);
    resetGeneratedVideo();
  }, [episode.id, episode.scriptSegments, resetGeneratedVideo, selectedTheory.id]);

  function chooseTopic(topic: HotTopic) {
    const theories = matchTheories(topic, theoryCards);
    setSelectedTopicId(topic.id);
    setSelectedTheoryId(theories[0].id);
    setConfirmedTheoryId(null);
    setIsScriptConfirmed(false);
    setIsStoryboardConfirmed(false);
    resetGeneratedVideo();
    setActiveStep("theory");
  }

  function chooseTheory(theoryId: string) {
    setSelectedTheoryId(theoryId);
    setConfirmedTheoryId(null);
    setIsScriptConfirmed(false);
    setIsStoryboardConfirmed(false);
    resetGeneratedVideo();
    setActiveStep("theory");
  }

  function confirmTheory() {
    setConfirmedTheoryId(selectedTheory.id);
    setActiveStep("script");
    window.setTimeout(() => {
      scriptRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function updateScriptSegment(segmentId: ScriptSegmentId, text: string) {
    setScriptSegments((segments) => segments.map((segment) => (segment.id === segmentId ? { ...segment, text } : segment)));
    setIsScriptConfirmed(false);
    setIsStoryboardConfirmed(false);
    resetGeneratedVideo();
    setActiveStep("script");
  }

  function confirmScript() {
    setIsScriptConfirmed(true);
    setIsStoryboardConfirmed(false);
    resetGeneratedVideo();
    setActiveStep("storyboard");
    window.setTimeout(() => {
      storyboardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function confirmStoryboard() {
    setIsStoryboardConfirmed(true);
    setActiveStep("video");
    window.setTimeout(() => {
      videoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function handleVideoGenerated(url: string) {
    setGeneratedVideoUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return url;
    });
    setActiveStep("publish");
    window.setTimeout(() => {
      publishRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  function scrollToStep(step: ActiveStep) {
    const refs: Record<ActiveStep, RefObject<HTMLDivElement>> = {
      topic: topicRef,
      theory: theoryRef,
      script: scriptRef,
      storyboard: storyboardRef,
      video: videoRef,
      publish: publishRef
    };
    setActiveStep(step);
    window.setTimeout(() => {
      refs[step].current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
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
              <strong>{nextStepLabel}</strong>
            </div>
          </div>
        </div>
      </section>

      <WorkflowStepper activeStep={activeStep} onStepSelect={scrollToStep} workflow={workflow} />

      <div className="shell workbench-layout">
        <div className="main-column">
          <div ref={topicRef}>
            <TopicDecisionPanel onSelect={chooseTopic} selectedTopicId={selectedTopic.id} topics={hotTopics} />
          </div>
          <ResearchPacketPanel packet={packet} topic={selectedTopic} />
          <div ref={theoryRef}>
            <TheoryLabPanel
              isConfirmed={isTheoryConfirmed}
              onConfirm={confirmTheory}
              onSelect={chooseTheory}
              selectedTheory={selectedTheory}
              theories={matchedTheories}
              thesis={episode.thesis}
            />
          </div>
          <div ref={scriptRef}>
            <ScriptWorkspace
              episode={editedEpisode}
              isActive={activeStep === "script"}
              isConfirmed={isScriptConfirmed}
              isUnlocked={isTheoryConfirmed}
              onConfirm={confirmScript}
              onSegmentChange={updateScriptSegment}
            />
          </div>
          <div ref={storyboardRef}>
            <DirectorStoryboard
              episode={editedEpisode}
              isActive={activeStep === "storyboard"}
              isConfirmed={isStoryboardConfirmed}
              isUnlocked={isScriptConfirmed}
              onConfirm={confirmStoryboard}
            />
          </div>
          <div ref={videoRef}>
            <VideoStudio
              episode={editedEpisode}
              generatedVideoUrl={generatedVideoUrl}
              isActive={activeStep === "video"}
              isUnlocked={isStoryboardConfirmed}
              onGenerated={handleVideoGenerated}
            />
          </div>
          <div ref={publishRef}>
            <PublishPackPanel drafts={drafts} generatedVideoUrl={generatedVideoUrl} isUnlocked={Boolean(generatedVideoUrl)} />
          </div>
        </div>
        <GrowthReviewPanel activeStep={activeStep} episode={editedEpisode} growth={growth} nextStepLabel={nextStepLabel} workflow={workflow} />
      </div>
    </main>
  );
}
