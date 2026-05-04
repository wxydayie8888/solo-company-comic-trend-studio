# 真实热点抓取接入指南

这份文档教你**零基础**把小红书/视频号的热点从"代理数据"换成"真实数据"。

## TL;DR

- **抖音**：DailyHotApi 已经返回真实数据，无需任何额外操作。
- **小红书**：装 Docker 跑 `xhs-toolkit`（要扫码登录你自己的小红书账号）。
- **视频号**：装 Docker 跑 `TrendRadar`（不需要登录）。覆盖度有限，最坏退回到 daily-hot 知乎代理。
- **快手**：DailyHotApi 也有真实端点，已切换。

---

## 平台 → 数据源对照表

| 平台 | 推荐源 | 真实度 | 是否要登录 | 备用源 |
|------|--------|--------|----------|--------|
| 抖音 | `daily-hot` | ✅ 真实 | 否 | — |
| 小红书 | `xhs-toolkit` | ✅ 真实 | **要扫码** | `daily-hot`（微博代理） |
| 视频号 | `trend-radar` | ⚠️ 半真实 | 否 | `daily-hot`（知乎代理） |
| 快手 | `daily-hot` | ✅ 真实 | 否 | — |

> 小红书是平台里风控最严的，必须有 cookie；其他都能匿名抓。

---

## 第 1 步：装 Docker Desktop（一次性）

如果你已经装过，跳过这一步。

### Mac 用户

1. 浏览器打开 https://www.docker.com/products/docker-desktop/
2. 点 **「Download for Mac - Apple Silicon」**（M1/M2/M3 芯片）或 **「Intel chip」**（旧 Mac）
3. 下载完成后双击 `.dmg`，把 Docker 图标拖到 Applications
4. 打开 Launchpad → 点 Docker，第一次启动需要授权管理员密码
5. 等右上角的鲸鱼图标变成稳定状态（不再有动画），下方提示 **"Docker Desktop is running"**

验证（在终端里）：

```bash
docker --version
# 应该输出：Docker version 27.x 之类
docker compose version
# 应该输出：Docker Compose version v2.30.x 之类
```

如果都有输出 = 装好了。

### Windows / Linux

- Windows：同上链接下载安装，需要先开 WSL2
- Linux：包管理器装 `docker.io` + `docker-compose-plugin` 即可

---

## 第 2 步：启动 Docker 服务

在项目根目录的终端里运行：

```bash
cd ~/solo-company-comic-trend-studio
docker compose up -d
```

`-d` = detached（后台运行）。第一次会下载镜像，预计 3-10 分钟（取决于网速）。

验证：

```bash
docker compose ps
```

你应该看到 3 个 `Up` 状态的容器：
```
NAME               STATUS         PORTS
solo-xhs-toolkit   Up 2 minutes   0.0.0.0:8005->8000/tcp
solo-trend-radar   Up 2 minutes   0.0.0.0:8006->8000/tcp
solo-daily-hot     Up 2 minutes   0.0.0.0:8007->6688/tcp
```

> 如果只起来 1-2 个，看 `docker compose logs xhs-toolkit` 排错（最常见是镜像 tag 不存在；见本文末「常见错误」）。

---

## 第 3 步：第一次给 xhs-toolkit 登录小红书

xhs-toolkit 抓小红书必须用你自己的账号 cookie。**第一次启动后必须扫码登录一次**，cookie 会存在 `./data/xhs-data/` 持久化下来，下次重启容器自动继续。

1. 浏览器打开 http://localhost:8005
2. 找登录入口（页面通常会显示 `Login` 或 `Add Account`），点扫码
3. 打开手机小红书 App → 我 → 右上角扫描图标 → 扫电脑屏幕的二维码
4. 手机上点确认登录
5. 网页上看到登录成功提示

**Cookie 大概 7-30 天会过期**，过期后再次访问 http://localhost:8005 重新扫码即可。

> ⚠️ 用专门的"小号"做这件事更安全。**不要**用主账号或敏感账号，万一被风控影响发布。

---

## 第 4 步：配 .env.local

```bash
open -e .env.local
```

把这几行改成（把已有的同名行替换或新增）：

```bash
HOT_API_BASE=http://localhost:8007        # 走自部署 daily-hot 镜像更稳

XIAOHONGSHU_SOURCE=xhs-toolkit
DOUYIN_SOURCE=daily-hot
SHIPINHAO_SOURCE=trend-radar
KUAISHOU_SOURCE=daily-hot

XHS_TOOLKIT_URL=http://localhost:8005
TREND_RADAR_URL=http://localhost:8006
```

保存关闭。

---

## 第 5 步：重启 dev server 让新配置生效

如果你的 `npm run dev` 还在跑，按 `Ctrl + C` 停掉，再重新运行：

```bash
npm run dev
```

---

## 第 6 步：验证

浏览器打开 http://localhost:3000，点 **「刷新今日热点」**，等 5-15 秒。

如果一切正常，状态条下方会出现一个**逐平台诊断**：

```
✓ 小红书   N 条   xhs-toolkit
✓ 抖音     N 条   daily-hot
✓ 视频号   N 条   trend-radar
✓ 快手     N 条   daily-hot
```

如果某个平台显示 ✕，旁边会写错误原因，按下面"常见错误"对症下药。

---

## 常见错误

### `image not found` 或拉镜像失败

某个 Docker 镜像 tag 不存在。改用 build from source：

```bash
# 例如 xhs-toolkit 拉不下来：
git clone https://github.com/aki66938/xhs-toolkit.git
cd xhs-toolkit
docker build -t xhs-toolkit:local .
cd ..
# 改 docker-compose.yml 里 image: xhs-toolkit:local
docker compose up -d xhs-toolkit
```

### `port is already allocated`

端口冲突。改 `docker-compose.yml` 里的 `ports`，比如 `8005:8000` 改成 `8015:8000`，然后 `.env.local` 里 `XHS_TOOLKIT_URL=http://localhost:8015`。

### xhs-toolkit 提示 cookie 失效

```bash
docker compose restart xhs-toolkit
# 浏览器重新打开 http://localhost:8005 扫码
```

### 视频号始终拿不到（trend-radar 0 条）

视频号没有公开的官方 API，trend-radar 也未必每次有数据。先回退到 daily-hot：

```bash
# 在 .env.local 改：
SHIPINHAO_SOURCE=daily-hot
```

LiveControls 状态条会标 `daily-hot · 代理`，提醒你这是知乎代理数据。

### 全部抓不到 / 全部超时

- 看 Docker 是否还在跑：`docker compose ps`
- 网络问题：`docker compose logs xhs-toolkit | tail -50`
- 火墙：Mac 系统设置 → 网络 → 防火墙 → 允许 Docker

### 抓得太慢

每个平台 8 秒超时；4 个平台并行，最坏 8 秒返回。慢得离谱多半是 dev server 同时在 SSR + AI 评分。可以暂时关掉 ANTHROPIC_API_KEY 测试是否是 AI 评分慢。

---

## 关掉 / 重启

```bash
# 停掉所有容器（数据保留）
docker compose stop

# 重启
docker compose start

# 完全删除（保留 ./data/xhs-data，下次还能用）
docker compose down

# 看日志
docker compose logs -f xhs-toolkit    # 跟随最新日志
docker compose logs trend-radar | tail -50
```

---

## 高级：自定义 Provider 路径

如果上游 API 路径不是默认的 `/api/v1/hot` / `/api/trends`，可以在 `.env.local` 覆盖：

```bash
XHS_TOOLKIT_FETCH_PATH=/api/v2/recommendations    # 实际 path
TREND_RADAR_FETCH_PATH=/api/v1/trending           # 实际 path
```

或者直接看每个 Provider 的代码改：

- `src/lib/server/providers/topicSources/xhsToolkit.ts`
- `src/lib/server/providers/topicSources/trendRadar.ts`

它们都是单文件 50-80 行，加个新字段或换 endpoint 都很简单。

---

## 更进一步

- 想完全自抓（不依赖第三方）：看 [NanmiCoder/MediaCrawler](https://github.com/NanmiCoder/MediaCrawler)（30K star，覆盖 6 平台），是 Python + Playwright，需要登录所有目标平台
- 想要自动每天凌晨抓：见 [`docs/cron-mac.md`](./cron-mac.md)
- 想接更多源（如 B 站、知乎自有热榜）：复制 `src/lib/server/providers/topicSources/dailyHotApi.ts` 改两行，加进 `index.ts` 的 factory 即可
