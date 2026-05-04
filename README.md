# 一人公司热点漫画短视频工具

个人使用的「每日社会热点认知解释工作台」MVP。

## 现状（Phase 1 + Phase 2）

### Phase 1：把"假"换成"真"

- ✅ **真实热点抓取**：`/api/topics/refresh` 通过 [DailyHotApi](https://github.com/imsyy/DailyHotApi) 拉取抖音/微博/知乎/B站 日榜
- ✅ **AI 选题评估**：每条热点经 Claude 打分（`accountFit / saveValue / commentPotential / brandRisk`）
- ✅ **AI 研究包**：自动生成事实摘要、争议点、不可说边界
- ✅ **AI 理论匹配**：从 32 条社会科学理论中挑出最贴合的 3 条
- ✅ **AI 重写脚本**：6 段结构（hook/scene/conflict/theory/turn/takeaway）+ 备选 + 风险提醒
- ✅ **本地持久化**：`data/*.json`（topics / theories / research / publish_logs）
- ✅ **离线 Fallback**：未配置 API Key 时所有 AI 端点回退到本地模板

### Phase 2：从字幕条到漫画 MP4 + 多平台发布

- ✅ **即梦文生图 Provider**：`src/lib/server/providers/jimeng-image.ts`（火山引擎 visual openapi，V4 签名）
- ✅ **即梦文生视频 Provider**：`src/lib/server/providers/jimeng-video.ts`（异步提交 + 轮询）
- ✅ **豆包 TTS Provider**：`src/lib/server/providers/bytedance-tts.ts`（中文女声/男声可选）
- ✅ **ffmpeg 合成器**：`src/lib/server/video/composer.ts`（图 + 旁白 + 字幕烧录 + BGM）
- ✅ **Episode 渲染 pipeline**：`/api/episode/render` 一键串起：分镜 → 8 张漫画图 → 8 段 TTS → 1 个 MP4
- ✅ **Mock 兜底**：未配置 AK/SK 时图像走 ffmpeg 占位、配音走静默，端到端仍能跑通
- ✅ **多平台发布桥接**：`/api/publish/submit` 通过 HTTP bridge 接 [xhs-toolkit](https://github.com/aki66938/xhs-toolkit) / [social-auto-upload](https://github.com/dreammis/social-auto-upload)；不配则降级为手动模式 + 写日志
- ✅ **增长数据导入**：`/api/growth` POST 批量导入回拉的播放/收藏/评论数据
- 📖 **完整即梦 API 教学**：见 [`docs/jimeng.md`](docs/jimeng.md)

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
├── src/app/page.tsx              客户端工作台
├── src/components/LiveControls.tsx  AI 控制条（刷新/重排/重写）
├── src/app/api/                  13 个服务端 API
│   ├── topics/                   GET / POST refresh（DailyHotApi + Claude 评估）
│   ├── theories/                 GET / POST（CRUD）
│   ├── theory/match              POST（Claude 排序）
│   ├── research/[topicId]        GET（Claude 生成研究包）
│   ├── script/generate           POST（Claude 写 6 段脚本）
│   ├── episode/render            POST（即梦+TTS+ffmpeg 合成 MP4）
│   ├── episode/preview-prompt    POST（预览每帧的图像 prompt）
│   ├── publish/submit            POST（HTTP 桥接到 xhs-toolkit / social-auto-upload）
│   ├── publish/log               GET / POST（发布历史）
│   ├── growth                    GET / POST（增长数据回拉）
│   └── health                    GET（AI/即梦/TTS 启用状态）
└── src/lib/server/
    ├── anthropic.ts / store.ts / hotTopicFetcher.ts ...
    ├── providers/                即梦图、即梦视频、豆包 TTS + mock
    ├── video/composer.ts         ffmpeg 合成器
    ├── pipeline/renderEpisode.ts 端到端编排
    └── publishers/               xhs-toolkit / social-auto-upload / manual
```

## 端到端工作流

1. 点 **「刷新今日热点」** → 抓真实热搜 + Claude 评分
2. 选热点 → **「AI 推荐理论」** → Claude 在 32 条中挑 3 条
3. 选理论 → **「AI 重写脚本」** → Claude 写 6 段 + 备选
4. 审分镜 → **「用即梦合成漫画 MP4」** → 8 张漫画图 + 8 段 TTS + ffmpeg → 输出 `public/generated/{episodeId}/final.mp4`
5. 复制四平台文案 → 点击发布按钮 → POST `/api/publish/submit` 走桥接 / 手动模式
6. 隔日 cron 拉数据 → POST `/api/growth` 导入 → 增长面板自动更新

## Phase 3 路线图

- [x] **真实热点抓取**：Provider 抽象 + xhs-toolkit / trend-radar / daily-hot 多源 → 见 [`docs/hot-topics.md`](docs/hot-topics.md)
- [x] **cron 调度（macOS launchd）**：每日凌晨自动 `/api/topics/refresh` → 见 [`docs/cron-mac.md`](docs/cron-mac.md)
- [ ] 角色一致性升级：先生成"主角立绘" → 后续每帧用即梦 i2v 模式带参考图
- [ ] 把静帧合成换成即梦视频片段：每段直接 i2v 生成 5s 动态视频
- [ ] 增长权重学习：根据回拉数据反哺 `topicScoring.ts` 的权重
- [ ] 风险闸门：再用一个 Claude subagent 审稿（敏感词、理论引用准确性、平台政策）

## 真实热点抓取（Phase 3）

默认情况下，小红书/视频号/快手 用 DailyHotApi 的代理（微博/知乎/B站热搜）。要切换到真实数据：

```bash
# 1. 装 Docker Desktop（一次性）
# 2. 启动本地服务（拉镜像约 5 分钟）
docker compose up -d
# 3. 浏览器 http://localhost:8005 扫码登录小红书（cookie 持久化）
# 4. 在 .env.local 加 XIAOHONGSHU_SOURCE=xhs-toolkit 等配置
# 5. 重启 npm run dev
```

详细指南：[`docs/hot-topics.md`](docs/hot-topics.md)。

要让 Mac 每天凌晨自动刷：[`docs/cron-mac.md`](docs/cron-mac.md)。

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
