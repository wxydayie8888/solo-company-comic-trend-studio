# 一人公司热点漫画短视频工具

个人使用的「每日社会热点认知解释工作台」MVP。

## 现状（Phase 1：把"假"换成"真"）

- ✅ **真实热点抓取**：`/api/topics/refresh` 通过 [DailyHotApi](https://github.com/imsyy/DailyHotApi) 拉取抖音/微博/知乎/B站 日榜
- ✅ **AI 选题评估**：每条热点经 Claude 打分（`accountFit / saveValue / commentPotential / brandRisk`）
- ✅ **AI 研究包**：自动生成事实摘要、争议点、不可说边界
- ✅ **AI 理论匹配**：从 32 条社会科学理论中挑出最贴合的 3 条
- ✅ **AI 重写脚本**：6 段结构（hook/scene/conflict/theory/turn/takeaway）+ 备选 + 风险提醒
- ✅ **本地持久化**：`data/*.json`（topics / theories / research / publish_logs）
- ✅ **离线 Fallback**：未配置 API Key 时所有 AI 端点回退到本地模板
- 🟡 **多平台发布**：`/api/publish/log` 已可记录发布历史；自动发布层（xhs-toolkit / social-auto-upload）见 Phase 2

## 32 条理论库

`src/lib/theoryLibrary.ts` 覆盖 8 类：

| 类别 | 概念 |
|------|------|
| 工作/职场 | 边界工作、情绪劳动、习得性无助、社会惰化 |
| 亲密关系 | 社会交换、依恋类型、自我披露 |
| 消费/经济 | 稀缺心态、损失厌恶、炫耀性消费、享乐适应 |
| 媒介/信息 | 框架效应、可得性启发、回音室、第三人效应、沉默的螺旋 |
| 城市/身份 | 参照群体、相对剥夺、文化资本 |
| AI/技术 | 马太效应、技能偏向技术变迁、自动化悖论 |
| 普适心理学 | 自我决定理论、邓宁-克鲁格、心流、身份过早封闭 |
| 群体行为 | 旁观者效应、道德许可、光环效应、社会认同、想象的共同体、弱关系的力量 |

## 本地运行

```bash
npm install
cp .env.example .env.local
# 在 .env.local 中填 ANTHROPIC_API_KEY（可选；无 key 走模板模式）
npm run dev
```

打开 `http://localhost:3000`，然后：

1. 点 **「刷新今日热点」** → 抓取真实热搜（首屏会替换 seed 数据）
2. 选一条热点 → **「AI 推荐理论」** 让 Claude 重排
3. 选定理论 → **「AI 重写脚本」** 让 Claude 写 6 段
4. 审分镜 → 生成视频（当前仍是 Canvas 字幕条，Phase 2 会换漫画图像）
5. 复制四平台文案，前往各平台发布；点击发布按钮自动写 `data/publish_logs.json`

## 架构

```
Next.js 14 (server mode)
├── src/app/page.tsx              客户端工作台（保留 demo 流程）
├── src/components/LiveControls.tsx  AI 控制条（刷新/重排/重写）
├── src/app/api/                  服务端 API
│   ├── topics/                   GET 列表 / POST refresh（DailyHotApi + Claude 评估）
│   ├── theories/                 GET / POST（CRUD）
│   ├── theory/match              POST（Claude 排序）
│   ├── research/[topicId]        GET（Claude 生成研究包）
│   ├── script/generate           POST（Claude 写 6 段脚本）
│   ├── publish/log               GET / POST（发布历史）
│   └── health                    GET（AI 是否启用 / 上次抓取时间）
└── src/lib/server/               服务端模块（Anthropic / store / fetcher）
```

## Phase 2 路线图

- [ ] 漫画图像：接入 Nano Banana 或即梦 3.0 API，每帧出图
- [ ] 视频合成：Node 端 ffmpeg，加 TTS、转场、字幕烧录、BGM
- [ ] 多平台发布：xhs-toolkit MCP（小红书）+ social-auto-upload（抖音/视频号/快手）
- [ ] 增长闭环：从平台回拉播放/收藏/评论数据 → 反哺选题权重

## 部署

不再支持 GitHub Pages 静态部署（Phase 1 之后必须有后端）。推荐：

- **Vercel**：直接接 GitHub 仓库；环境变量在控制台填
- **自托管**：`npm run build && npm start`，端口 3000

## 命令

```bash
npm run dev          # 开发
npm run build        # 生产构建
npm run start        # 生产运行
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm run test:e2e     # Playwright
```
