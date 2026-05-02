import { ContentThesis, HotTopic, TheoryCard } from "./types";

const fallbackTheoryIds = ["framing-effect", "social-comparison", "boundary-work"];

export function matchTheories(topic: HotTopic, theories: TheoryCard[]) {
  const directMatches = theories
    .filter((theory) => theory.bestForTopics.includes(topic.id))
    .sort((a, b) => b.explanatoryPower - a.explanatoryPower);

  const fallbackMatches = fallbackTheoryIds
    .map((id) => theories.find((theory) => theory.id === id))
    .filter((theory): theory is TheoryCard => Boolean(theory));

  return [...directMatches, ...fallbackMatches]
    .filter((theory, index, all) => all.findIndex((item) => item.id === theory.id) === index)
    .slice(0, 3);
}

export function createThesis(topic: HotTopic, theory: TheoryCard): ContentThesis {
  const goldenLine = theory.goldenLines[0] ?? topic.youthAngle;

  return {
    topicId: topic.id,
    theoryId: theory.id,
    coreClaim: `${topic.title}真正值得讲的，不是站队，而是用「${theory.name}」看见：${theory.angle}`,
    antiMisreading: theory.misreadings[0] ?? "这个理论不是万能解释，必须保留事实边界。",
    audienceTakeaway: topic.youthAngle,
    tensionQuestion: `为什么这件事看起来只是个人选择，却会让这么多人同时有情绪？`,
    goldenLine,
    commentQuestion: `你更认同这是一种个人选择，还是一套默认规则的问题？`
  };
}
