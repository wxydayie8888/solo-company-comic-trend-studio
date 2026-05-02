import { ContentThesis, CoverConcept, DirectorFrame, HotTopic, ScriptSegment, TheoryCard, VisualIdentity } from "./types";

export function buildVisualIdentity(topic: HotTopic): VisualIdentity {
  const isWork = topic.id.includes("work");
  const isRelationship = topic.id.includes("relationship");

  return {
    mainCharacter: isWork ? "25 岁职场新人，短发，帆布包，表情克制但有锋芒" : "26 岁青年创作者，圆框眼镜，连帽衫，观察者气质",
    supportingCharacter: isRelationship ? "亲密关系中的另一位年轻人，表情真诚但疲惫" : "评论区拟人角色，用不同颜色气泡表达立场",
    palette: "米白底、墨绿色主色、珊瑚红强调冲突、蓝色表达理性解释",
    lineStyle: "干净漫画线条，半写实表情，背景简化但生活细节明确",
    continuityRules: [
      "主角服装和发型全片保持一致",
      "理论解释段使用同一块黑板或便签墙",
      "红色只用于冲突和风险，绿色只用于解决和带走句"
    ]
  };
}

export function buildDirectorFrames(
  topic: HotTopic,
  theory: TheoryCard,
  thesis: ContentThesis,
  segments: ScriptSegment[],
  visualIdentity: VisualIdentity
): DirectorFrame[] {
  const durationMap = [6, 10, 8, 12, 11, 9, 8];
  const frameSegments = [segments[0], segments[1], segments[2], segments[3], segments[3], segments[4], segments[5]];

  return frameSegments.map((segment, index) => {
    const isTheoryFrame = segment.id === "theory";
    const isTakeaway = segment.id === "takeaway";
    const beat = index === 4 ? "机制拆解" : segment.label;

    return {
      id: index + 1,
      beat,
      role: segment.id,
      scene: isTheoryFrame
        ? `便签墙前，主角把「${theory.name}」拆成三个关键词`
        : isTakeaway
          ? "城市夜色和手机通知都安静下来，主角看向镜头"
          : `围绕「${topic.title}」的生活化漫画场景`,
      camera: index === 0 ? "手机通知特写，快速推近" : isTheoryFrame ? "中景固定镜头，手部写字插入" : "中近景，轻微横移",
      composition: isTakeaway ? "上方留封面标题空间，人物在下三分之一" : "人物居中，左右用评论气泡或图标承载信息",
      visualPrompt: `${visualIdentity.lineStyle}，${visualIdentity.palette}，${segment.goal}，主题：${topic.title}`,
      narration: segment.text,
      caption: index === 0 ? topic.youthAngle : isTheoryFrame ? theory.name : isTakeaway ? thesis.goldenLine : segment.label,
      subtitleTiming: index === 0 ? "前 1 秒只出关键词，第 2 秒补完整句" : "每 8-12 个字断一行，关键词加粗色",
      safeArea: "字幕位于画面中下区域，避开底部 300px 平台操作区",
      sound: isTheoryFrame ? "粉笔声、轻微提示音" : isTakeaway ? "BGM 降低，旁白留半秒空白" : "轻点击声和低频转场",
      transition: index === 0 ? "通知弹出硬切" : isTakeaway ? "慢推后定格" : "漫画分格滑动",
      duration: durationMap[index]
    };
  });
}

export function buildCoverConcepts(topic: HotTopic, theory: TheoryCard, thesis: ContentThesis): CoverConcept[] {
  return [
    {
      id: "A",
      headline: topic.youthAngle,
      prompt: `竖屏漫画封面，主角站在手机通知和生活空间之间，标题为「${topic.youthAngle}」，干净强对比`,
      composition: "人物占下半屏，标题在上方 35%，中间用一条清晰边界线制造冲突",
      platformFit: "小红书和视频号更适合，收藏感强"
    },
    {
      id: "B",
      headline: `用${theory.name}看懂这件事`,
      prompt: `竖屏漫画知识封面，黑板写着「${theory.name}」，旁边有热点场景小分格，标题清晰`,
      composition: "左侧理论关键词，右侧热点场景，底部放一句金句",
      platformFit: `抖音和快手更适合，解释感强；金句：${thesis.goldenLine}`
    }
  ];
}
