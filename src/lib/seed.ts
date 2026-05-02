import { GrowthMetric, HotTopic, ResearchPacket, TheoryCard } from "./types";

export const hotTopics: HotTopic[] = [
  {
    id: "work-boundary",
    platform: "小红书",
    title: "年轻人开始把「下班不回消息」写进自我介绍",
    heat: 92,
    emotion: 88,
    signals: {
      accountFit: 94,
      novelty: 72,
      saveValue: 86,
      commentPotential: 91,
      brandRisk: 18
    },
    summary: "围绕工作边界、即时通讯压力和职场礼貌的讨论持续升温。",
    sourceUrl: "https://www.xiaohongshu.com/",
    sourceLabel: "公开讨论趋势",
    riskTags: ["低风险"],
    youthAngle: "把私人时间拿回来，不等于不负责。",
    recommendedReason: "冲突清楚、共鸣强，适合做成工作边界的第一条账号代表作。",
    rejectReasons: ["如果只骂老板，会变成情绪吐槽。", "需要避开具体公司和个案指控。"]
  },
  {
    id: "consumption-fatigue",
    platform: "抖音",
    title: "「不买立省 100%」成为年轻人的新消费口号",
    heat: 86,
    emotion: 81,
    signals: {
      accountFit: 90,
      novelty: 80,
      saveValue: 92,
      commentPotential: 78,
      brandRisk: 16
    },
    summary: "从省钱、断舍离到反向种草，年轻人重新讨论消费带来的身份压力。",
    sourceUrl: "https://www.douyin.com/",
    sourceLabel: "公开热议内容",
    riskTags: ["低风险"],
    youthAngle: "少买不是变穷，是重新夺回选择权。",
    recommendedReason: "可收藏价值高，适合形成「理解消费焦虑」系列。",
    rejectReasons: ["不能把节制消费说成唯一正确。", "标题不要羞辱正常消费。"]
  },
  {
    id: "relationship-label",
    platform: "视频号",
    title: "亲密关系里「情绪价值」到底是不是一种劳动",
    heat: 84,
    emotion: 90,
    signals: {
      accountFit: 88,
      novelty: 76,
      saveValue: 84,
      commentPotential: 94,
      brandRisk: 42
    },
    summary: "情侣、朋友、家人之间围绕陪伴、回应和情绪消耗产生争论。",
    sourceUrl: "https://channels.weixin.qq.com/",
    sourceLabel: "公开话题观察",
    riskTags: ["平台敏感"],
    youthAngle: "被理解很珍贵，但不能把一个人变成全天候客服。",
    recommendedReason: "评论诱发很强，但需要温和表达，避免替具体关系下判断。",
    rejectReasons: ["容易滑向情感审判。", "不能给心理诊断或关系处方。"]
  },
  {
    id: "ai-anxiety",
    platform: "快手",
    title: "AI 工具越多，普通人为什么反而更焦虑",
    heat: 79,
    emotion: 76,
    signals: {
      accountFit: 82,
      novelty: 69,
      saveValue: 77,
      commentPotential: 73,
      brandRisk: 34
    },
    summary: "围绕 AI 替代、学习压力和效率工具焦虑的内容增长。",
    sourceUrl: "https://www.kuaishou.com/",
    sourceLabel: "公开趋势观察",
    riskTags: ["事实不确定"],
    youthAngle: "工具变多以后，真正稀缺的是判断力。",
    recommendedReason: "适合连接 AI 热点和账号定位，但需要避免制造替代恐慌。",
    rejectReasons: ["热度和事实规模需要验证。", "不能承诺工具带来收入结果。"]
  },
  {
    id: "city-belonging",
    platform: "小红书",
    title: "越来越多人说「不是逃离大城市，是换一种活法」",
    heat: 82,
    emotion: 78,
    signals: {
      accountFit: 86,
      novelty: 67,
      saveValue: 82,
      commentPotential: 80,
      brandRisk: 22
    },
    summary: "关于城市、收入、通勤、社交和生活质量的取舍讨论变多。",
    sourceUrl: "https://www.xiaohongshu.com/",
    sourceLabel: "公开笔记观察",
    riskTags: ["低风险"],
    youthAngle: "人生不是只有一种上升路线。",
    recommendedReason: "适合做温和但有辨识度的人生路线讨论。",
    rejectReasons: ["容易变成大城市/小城市二元对立。", "个体差异很大，不宜给统一答案。"]
  }
];

export const researchPackets: Record<string, ResearchPacket> = {
  "work-boundary": {
    topicId: "work-boundary",
    factSummary: "讨论围绕即时通讯带来的隐形加班、团队协作预期和个人边界展开。主流情绪不是拒绝工作，而是希望规则清楚。",
    timeline: [
      { time: "上午", event: "多条笔记把下班后消息截图与自我介绍模板放在一起讨论。" },
      { time: "中午", event: "评论区分成「边界必要」和「团队协作不能断线」两类立场。" },
      { time: "下午", event: "职场博主开始把话题转向组织规则和沟通 SLA。" }
    ],
    debates: ["下班不回消息是职业边界，还是团队不负责？", "年轻人是在反抗压榨，还是降低协作成本意识？"],
    perspectives: ["员工视角：休息权被即时消息侵蚀。", "管理视角：缺少明确紧急程度标准。", "组织视角：问题不在消息，而在没有边界协议。"],
    sourceNotes: ["公开平台讨论观察", "劳动时间与组织沟通相关研究可作为背景"],
    uncertainties: ["具体平台热度需要接入正式数据源后校验。"],
    cannotSay: ["不能断言某公司违法。", "不能把单个截图扩展成全行业事实。"]
  },
  "consumption-fatigue": {
    topicId: "consumption-fatigue",
    factSummary: "年轻用户用幽默口号表达消费疲劳，讨论重点从买什么转向为什么要买。",
    timeline: [
      { time: "上午", event: "反向种草内容获得高互动。" },
      { time: "中午", event: "评论区分享不买清单和消费后悔经历。" },
      { time: "下午", event: "延伸到工资、焦虑和身份展示压力。" }
    ],
    debates: ["省钱是理性，还是被经济压力迫使？", "不买是不是另一种身份表达？"],
    perspectives: ["消费者视角：减少冲动消费。", "品牌视角：传统种草话术疲劳。", "社会视角：身份展示成本上升。"],
    sourceNotes: ["公开内容趋势", "消费社会与地位信号理论可作为背景"],
    uncertainties: ["不同城市和收入群体差异未验证。"],
    cannotSay: ["不能把节制消费包装成贫穷羞辱。"]
  },
  "relationship-label": {
    topicId: "relationship-label",
    factSummary: "讨论把亲密关系中的陪伴、倾听、回应称作情绪价值，引发对关系劳动和边界的再解释。",
    timeline: [
      { time: "上午", event: "情侣关系案例引发转发。" },
      { time: "中午", event: "朋友关系和亲子关系案例加入讨论。" },
      { time: "下午", event: "评论开始争论情绪支持是否应该被量化。" }
    ],
    debates: ["情绪价值是爱的表达，还是被商品化的关系劳动？", "要求回应是正常需要，还是控制？"],
    perspectives: ["亲密者视角：希望被看见。", "照顾者视角：持续回应会消耗。", "关系视角：双方都需要可持续边界。"],
    sourceNotes: ["公开视频号讨论", "社会交换理论与情绪劳动相关概念可作背景"],
    uncertainties: ["案例真实性和代表性无法仅凭评论确认。"],
    cannotSay: ["不能替具体关系下诊断。", "不能做心理治疗或法律建议。"]
  },
  "ai-anxiety": {
    topicId: "ai-anxiety",
    factSummary: "用户一边收藏 AI 工具，一边担心学不会、被替代或错过机会，形成工具焦虑。",
    timeline: [
      { time: "上午", event: "AI 工具清单类内容继续增长。" },
      { time: "中午", event: "评论区出现「越收藏越焦虑」的反向反馈。" },
      { time: "下午", event: "讨论转向普通人到底该学什么。" }
    ],
    debates: ["AI 是降低门槛，还是制造新门槛？", "普通人要追工具，还是练判断力？"],
    perspectives: ["学习者视角：害怕落后。", "创作者视角：工具更新成为内容焦虑来源。", "职业视角：能力结构在变。"],
    sourceNotes: ["公开平台观察", "技术采用曲线与社会比较理论可作背景"],
    uncertainties: ["热度规模需要真实平台数据验证。"],
    cannotSay: ["不能承诺某工具一定提高收入。", "不能制造替代恐慌。"]
  },
  "city-belonging": {
    topicId: "city-belonging",
    factSummary: "讨论从逃离大城市转向重新定义生活质量，包括通勤、房租、朋友、职业机会和心理能量。",
    timeline: [
      { time: "上午", event: "搬离一线城市的经验帖被讨论。" },
      { time: "中午", event: "评论区对收入下降和生活质量提升展开比较。" },
      { time: "下午", event: "话题延伸到人生路线和家庭期待。" }
    ],
    debates: ["回小城市是降级，还是选择更合适的生活？", "稳定和机会哪个更重要？"],
    perspectives: ["个人视角：追求可持续生活。", "家庭视角：期待稳定和体面。", "城市视角：机会与成本同时集中。"],
    sourceNotes: ["公开笔记观察", "参照群体与生活方式迁移可作背景"],
    uncertainties: ["个体案例差异很大。"],
    cannotSay: ["不能把城市选择做成唯一正确答案。"]
  }
};

export const theoryCards: TheoryCard[] = [
  {
    id: "boundary-work",
    name: "边界工作",
    oneSentence: "人会通过规则、语言和仪式，划出什么属于工作、什么属于生活。",
    explanatoryPower: 94,
    misuseRisk: "容易被误读成只要设边界就不用协作。",
    angle: "解释为什么一条下班消息会让人感觉私人时间被入侵。",
    everydayExample: "把手机调成勿扰，不是消失，而是告诉别人现在不在工作场域。",
    bestForTopics: ["work-boundary", "relationship-label"],
    misreadings: ["边界不是冷漠，也不是拒绝承担责任。", "边界不等于把沟通全部推给对方。"],
    counterExamples: ["真正紧急的安全问题需要例外规则。", "团队事先约定了值班机制时，回应就不再是隐形加班。"],
    sourceRefs: ["组织社会学中的边界工作", "工作家庭边界理论"],
    goldenLines: ["好的边界不是把门关上，而是告诉别人什么时候可以敲门。", "让人崩溃的不是消息，是永远默认你在线。"]
  },
  {
    id: "scarcity-mindset",
    name: "稀缺心态",
    oneSentence: "当人感觉钱、时间或机会不够时，大脑会更关注眼前压力，而不是长期选择。",
    explanatoryPower: 88,
    misuseRisk: "不能把结构性压力都说成个人心态问题。",
    angle: "解释为什么省钱口号既轻松又带着一点防御。",
    everydayExample: "看到满减时反复计算，其实是在对抗不确定感。",
    bestForTopics: ["consumption-fatigue", "ai-anxiety"],
    misreadings: ["稀缺心态不是说人不努力。", "省钱不一定是消费降级，也可能是价值排序升级。"],
    counterExamples: ["高收入人群也可能因时间稀缺而焦虑。", "长期规划需要现实资源支持，不只是心态调整。"],
    sourceRefs: ["行为经济学中的稀缺理论", "消费心理学"],
    goldenLines: ["少买不是退出生活，而是把注意力赎回来。", "真正贵的不是商品，是你被它占走的判断力。"]
  },
  {
    id: "social-exchange",
    name: "社会交换理论",
    oneSentence: "关系会在情感、时间、支持和回报之间寻找一种可持续的平衡。",
    explanatoryPower: 86,
    misuseRisk: "不能把亲密关系完全算账化。",
    angle: "解释为什么情绪价值既是爱，也可能成为负担。",
    everydayExample: "朋友愿意听你倾诉，但也需要被看见和休息。",
    bestForTopics: ["relationship-label", "work-boundary"],
    misreadings: ["关系不是交易表。", "谈回报不是功利，而是让关系不被耗尽。"],
    counterExamples: ["照护、亲情和危机支持不能简单等价交换。", "短期失衡不等于关系失败。"],
    sourceRefs: ["社会交换理论", "情绪劳动研究"],
    goldenLines: ["亲密不是全天候客服，爱也需要可持续。", "最好的情绪价值，是双方都不用透支自己。"]
  },
  {
    id: "social-comparison",
    name: "社会比较",
    oneSentence: "人会通过和别人比较来判断自己的位置，工具越多，比较对象也越多。",
    explanatoryPower: 82,
    misuseRisk: "不能把技术变化造成的真实压力简化成嫉妒。",
    angle: "解释 AI 工具越多，为什么人反而更怕落后。",
    everydayExample: "收藏 100 个工具后，真正让人焦虑的是别人好像已经用它赚钱了。",
    bestForTopics: ["ai-anxiety", "city-belonging"],
    misreadings: ["比较不是虚荣，是人判断位置的默认方式。", "焦虑不总是个人脆弱，也可能是竞争规则改变。"],
    counterExamples: ["清楚的学习目标能降低比较带来的噪音。", "某些岗位的 AI 压力是真实技能迁移问题。"],
    sourceRefs: ["社会比较理论", "技术采用与身份焦虑"],
    goldenLines: ["你焦虑的不是工具太多，而是排行榜突然变长了。", "工具会更新，判断力才是你的操作系统。"]
  },
  {
    id: "reference-group",
    name: "参照群体",
    oneSentence: "一个人怎么评价自己的生活，常常取决于他拿谁当参照。",
    explanatoryPower: 84,
    misuseRisk: "不能忽视收入、家庭和城市资源的现实差异。",
    angle: "解释为什么换城市像是在换一套人生评分表。",
    everydayExample: "在一线城市觉得自己慢，换到另一座城市后发现生活节奏可以重新定义。",
    bestForTopics: ["city-belonging", "consumption-fatigue"],
    misreadings: ["换参照不是逃避现实。", "参照群体会影响感受，但不能替代收入和机会。"],
    counterExamples: ["职业高集中行业仍然需要城市资源。", "家庭照护和医疗教育会改变城市选择。"],
    sourceRefs: ["参照群体理论", "城市社会学与生活方式研究"],
    goldenLines: ["换一座城市，有时候是在换一张人生计分表。", "不是你跑得慢，是你可能站错了赛道。"]
  },
  {
    id: "framing-effect",
    name: "框架效应",
    oneSentence: "同一件事被放进不同表达框架里，会触发完全不同的判断。",
    explanatoryPower: 78,
    misuseRisk: "不能把事实争议只归因于话术包装。",
    angle: "解释为什么「拒绝加班」和「保护协作规则」听起来像两件事。",
    everydayExample: "同样是不回消息，说成失联和说成非工作时间，感受完全不同。",
    bestForTopics: ["work-boundary", "consumption-fatigue", "city-belonging"],
    misreadings: ["框架不是洗白事实。", "换表达不能代替解决真实问题。"],
    counterExamples: ["当事实足够明确时，框架影响会下降。", "涉及权利侵害时不能只讨论表达方式。"],
    sourceRefs: ["认知心理学中的框架效应", "传播学议题框架"],
    goldenLines: ["很多争论不是答案不同，而是题目被写成了两套。", "换一个框架，不是换立场，是先看见问题长什么样。"]
  }
];

export const growthMetrics: GrowthMetric[] = [
  {
    date: "2026-04-24",
    platform: "小红书",
    title: "为什么你越省钱，越像在夺回人生？",
    views: 18400,
    completionRate: 61,
    likes: 920,
    saves: 1460,
    comments: 138,
    commentKeywords: ["消费疲劳", "安全感", "不买"]
  },
  {
    date: "2026-04-25",
    platform: "抖音",
    title: "下班后不回消息，真的是不负责吗？",
    views: 32600,
    completionRate: 54,
    likes: 1780,
    saves: 810,
    comments: 266,
    commentKeywords: ["边界", "领导", "协作"]
  },
  {
    date: "2026-04-26",
    platform: "视频号",
    title: "情绪价值，为什么会把人累垮？",
    views: 9600,
    completionRate: 68,
    likes: 520,
    saves: 640,
    comments: 74,
    commentKeywords: ["亲密关系", "倾听", "边界"]
  }
];
