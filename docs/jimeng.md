# 即梦 API 接入指南

这份文档教你**从 0 到 1** 把"即梦 AI"（字节跳动旗下的图像/视频生成模型）接入这个项目。
项目里已经写好了 Provider 实现（`src/lib/server/providers/jimeng-image.ts` 等），
你只需要按下面步骤拿到 AK/SK 并填到 `.env.local`，就能在工作台点「用即梦合成漫画 MP4」一键出片。

---

## 1. 接入路径选择：用火山引擎，不要用网页版

| 路径 | 是否推荐 | 原因 |
|------|---------|------|
| `jimeng.jianying.com`（即梦网页版） | ❌ | 是 2C 产品，没有正式 API。GitHub 上 `jimeng-free-api` 一类项目靠抓 sessionid 模拟登录，仅适合个人玩，不能用于稳定出片 |
| `visual.volcengineapi.com`（火山引擎 visual openapi） | ✅ | 字节官方收费 API，接的就是即梦同款模型，稳定可商用 |

**结论：去火山引擎控制台开通"视觉智能"。**

---

## 2. 开通火山引擎 + 拿到 AK/SK

### 2.1 注册账号

1. 打开 https://www.volcengine.com，用手机号注册并完成实名认证（个人即可）
2. 进入控制台 https://console.volcengine.com

### 2.2 开通视觉智能

1. 控制台搜索 **"视觉智能"** 或 **"即梦 AI"**
2. 找到 "视觉智能 - 即梦 AI" 或 "视觉智能 - 通用" 服务
3. 点击 **开通**（个人开通即可，无需企业认证）
4. 开通后会赠送少量代金券（可生成几十张图试水）

### 2.3 创建 AK/SK

1. 控制台右上角头像 → **API 访问密钥**
2. **创建密钥** → 拿到 `Access Key ID` 和 `Secret Access Key`
3. **重要**：Secret 只显示一次，立刻保存到密码管理器

### 2.4 把 Key 填到项目

在项目根目录的 `.env.local` 里加：

```bash
VOLC_ACCESS_KEY_ID=AKLT...
VOLC_SECRET_ACCESS_KEY=NW....
# 可选：换模型版本（默认 jimeng_t2i_v31，文字稳定性最好）
JIMENG_IMAGE_REQ_KEY=jimeng_t2i_v31
JIMENG_VIDEO_REQ_KEY=jimeng_vgfm_t2v_l20
```

重启 `npm run dev` 即可。`/api/health` 会显示 `aiEnabled: true`。

---

## 3. 关键参数速查

### 3.1 Endpoint

```
POST https://visual.volcengineapi.com/?Action=CVProcess&Version=2022-08-31
```

文生视频两步走：
- 提交任务：`?Action=CVSync2AsyncSubmitTask&Version=2022-08-31`
- 拉结果：`?Action=CVSync2AsyncGetResult&Version=2022-08-31`

### 3.2 签名

火山引擎用 **V4 签名**（与 AWS SigV4 兼容，但不加 `AWS4` 前缀）：

- Service: `cv`
- Region: `cn-north-1`（**写错会签名失败，例如不能写 cn-beijing**）
- 必填 Header：`Host`、`X-Date`（UTC，格式 `YYYYMMDDTHHMMSSZ`）、`X-Content-Sha256`、`Content-Type`、`Authorization`
- 派生密钥链：`HMAC(SK, date) → HMAC(., region) → HMAC(., "cv") → HMAC(., "request")`

项目里 `src/lib/server/providers/volcengineSign.ts` 已实现完整签名，无需自己写。

### 3.3 模型 req_key

**文生图**：

| req_key | 模型 | 适用 |
|---------|------|------|
| `jimeng_t2i_v30` | 即梦 3.0 | 通用文生图 |
| `jimeng_t2i_v31` ⭐ | 即梦 3.1 | 海报、含字场景；本项目默认 |
| `high_aes_general_v21_L` | 高美 v2.1 | 老接口兼容 |

**文生视频 / 图生视频**：

| req_key | 模式 | 适用 |
|---------|------|------|
| `jimeng_vgfm_t2v_l20` | 文生视频 720P | 纯 prompt → 5s 视频 |
| `jimeng_vgfm_i2v_l20` | 图生视频 720P | 首帧图 + prompt → 5s 视频（角色一致性更好） |

**本项目目前只用文生图**（每帧一张），视频合成走 ffmpeg。如果你想直接出视频片段，可以在 `renderEpisode.ts` 里调用 `JimengVideoProvider`。

---

## 4. 文生图请求示例

```bash
POST https://visual.volcengineapi.com/?Action=CVProcess&Version=2022-08-31
Content-Type: application/json
X-Date: 20260504T013351Z
X-Content-Sha256: <sha256(body)>
Authorization: HMAC-SHA256 Credential=<AK>/20260504/cn-north-1/cv/request, SignedHeaders=content-type;host;x-content-sha256;x-date, Signature=<hex>

{
  "req_key": "jimeng_t2i_v31",
  "prompt": "中文社交媒体漫画分镜，竖屏构图，干净线稿，主角是 25 岁微笑女性，办公场景，柔和阴影",
  "width": 1024,
  "height": 1024,
  "seed": 12345,
  "scale": 2.5,
  "use_pre_llm": true,
  "use_sr": true,
  "return_url": false
}
```

返回：

```json
{
  "code": 10000,
  "data": {
    "binary_data_base64": ["<base64 PNG>"],
    "algorithm_base_resp": { "status_code": 0 }
  },
  "request_id": "..."
}
```

**关键字段含义**：

| 字段 | 推荐 | 说明 |
|------|-----|------|
| `seed` | 固定整数 | 跨多帧用同一 seed，能让角色长得像同一个人 |
| `scale` | 2.5 | CFG scale，越高越贴 prompt，但容易僵硬 |
| `use_pre_llm` | `true` | **强烈建议开**。让模型先用 LLM 改写 prompt，输出大幅提升 |
| `use_sr` | `true` | 超分（SR），让分辨率更高 |
| `return_url` | `false` | 推荐 `false` 拿 base64 直接落本地，避免 24h URL 过期 |

---

## 5. 文生视频（异步）

```bash
# 1) 提交
POST ?Action=CVSync2AsyncSubmitTask&Version=2022-08-31
{ "req_key": "jimeng_vgfm_t2v_l20", "prompt": "...", "seed": -1, "aspect_ratio": "9:16" }
# → { "code": 10000, "data": { "task_id": "xxxx" } }

# 2) 轮询（5-10 秒一次，典型 60-180 秒完成）
POST ?Action=CVSync2AsyncGetResult&Version=2022-08-31
{ "req_key": "jimeng_vgfm_t2v_l20", "task_id": "xxxx" }
# → { "data": { "status": "in_queue|generating|done|failed", "video_url": "..." } }
```

`status === "done"` 后 `video_url` 24 小时过期，立即下载到本地存储。

---

## 6. 价格（2026 春参考，以官方计费页为准）

| 项目 | 单价 | 备注 |
|------|------|------|
| 即梦 3.0/3.1 文生图 1024×1024 | ~0.2 元/张 | 1080×1920 略贵 |
| 即梦 3.0 文生视频 5s 720P | 几元 | 1080P 翻倍 |
| 文生视频 10s 1080P | 十几元 | |

**单条 60-90s 漫画短视频成本估算**：8 帧图 ≈ 1.6 元 + 8 段 TTS（豆包 ~0.04 元/万字符，可忽略）+ ffmpeg 本地合成（0 元）≈ **<2 元/条**。

新企业号常有 3 折券，控制台多关注。

官方计费：
- 图像：https://www.volcengine.com/docs/85621/1544714
- 视频：https://www.volcengine.com/docs/85621/1544715

---

## 7. 风格与角色一致性

### 风格

漫画 / 卡通 / 国风主要靠 prompt：

| 想要的风格 | prompt 关键词 |
|-----------|--------------|
| 日系漫画 | "日系漫画线稿，cel shading，柔和阴影" |
| 美式 cartoon | "American cartoon style, bold lines, flat colors" |
| 国风 | "国风插画，水墨工笔，淡雅留白" |
| 小红书友好 | "扁平插画，莫兰迪色系，干净留白" |

**中文 prompt 在即梦上效果通常比英文好。**

### 角色一致性（关键！）

要让 8 帧分镜里的主角"看起来是同一个人"：

1. **固定 seed**：所有帧用同一个整数 seed（项目已实现，按 `episodeId+characterDesc` hash 出来）
2. **prompt 里写死人物特征**：发型、年龄段、衣着、配饰；写得越具体越稳
3. **进阶**：先用文生图生成一张"角色立绘"，然后用 **图生视频 i2v** 模式，每帧带上立绘作为 `image_urls`

项目里 `src/lib/server/pipeline/renderEpisode.ts` 已经把 `episode.visualIdentity.mainCharacter` 拼进每帧 prompt，并固定 seed。

---

## 8. 配音（豆包 TTS）

豆包 TTS 是另一个产品（不在 visual openapi 里），需要单独开通：

1. 控制台搜索 **"语音技术"** → **"语音合成（TTS）"** → 开通
2. 创建应用，拿到 `appid` 和 `Access Token`（注意：是 Access Token，不是 AK/SK）
3. 填 `.env.local`：

```bash
BYTEDANCE_TTS_APPID=1234567890
BYTEDANCE_TTS_TOKEN=xxx
BYTEDANCE_TTS_CLUSTER=volcano_tts
# 推荐音色（中文女声，年轻聪明感）
BYTEDANCE_TTS_VOICE=BV700_streaming
```

可选音色：
- `BV001_streaming` 通用女声
- `BV002_streaming` 通用男声
- `BV700_streaming` ⭐ 灿灿（聪明活力女声，适合年轻人内容）
- `BV701_streaming` 擎苍（沉稳男声，适合科普）

---

## 9. 常见错误排查

| 错误 | 原因 | 修复 |
|------|------|------|
| `Invalid Authorization` | X-Date 时区错（必须 UTC、Z 结尾） | 检查 `new Date().toISOString()` 输出 |
| `SignatureDoesNotMatch` | SignedHeaders 顺序与签名时不一致 | 必须按字典序 + 全小写 |
| `60001/60002 内容审核未通过` | prompt 含血腥/政治/真人明星 | 加"卡通化、无血、虚构人物"限定词 |
| `image_urls` 拿到的 URL 404 | 24h 过期 | 改用 `return_url: false` 拿 base64，或拿到立刻下载 |
| Region 错误 | 写成 `cn-beijing` 等 | CV 服务**固定** `cn-north-1` |
| `60011 NoQuota` | 余额不足或代金券到期 | 控制台充值 |

---

## 10. 替代方案

如果即梦审核太严或排队太久，本项目的 Provider 抽象支持快速切换：

| 模型 | 来源 | req_key / 说明 |
|------|------|---------------|
| 豆包 SeedDream | 同火山账号 | 改 `req_key=high_aes_seeddream_*` |
| Seedance 2.0（视频） | 同火山账号 | 改 `req_key=seedance_*` |
| 通义万相 | 阿里云 | 换 Provider，调 `dashscope.aliyuncs.com` |
| 可灵 Kling | 快手 | 换 Provider，调 `klingai.com` API |
| Nano Banana | Google Gemini | 换 Provider，调 `generativelanguage.googleapis.com` |

要新增 Provider，只需实现 `src/lib/server/providers/types.ts` 中的 `ImageProvider` 接口，然后在 `providers/index.ts` 的 factory 里加分支。

---

## 11. 项目内调用流程

```
用户在 VideoStudio 点「用即梦合成漫画 MP4」
  ↓
POST /api/episode/render { episode }
  ↓
renderEpisode(episode):
  1) 对每个 storyboard frame:
     buildImagePrompt(frame, visualIdentity)
     → JimengImageProvider.generate() → public/generated/{episodeId}/frame-NN.png
  2) 对每个 frame 的 narration:
     BytedanceTtsProvider.synthesize() → narration-NN.mp3
  3) composeVideo({ frames, ... })
     → ffmpeg 把每帧 PNG + 旁白 MP3 + 字幕 → 单帧 MP4 → concat → final.mp4
  ↓
返回 { videoUrl: "/generated/{episodeId}/final.mp4", frameUrls, providers }
```

---

## 12. 部署注意

- **本地开发**：`npm run dev` 直接跑，写入 `public/generated/`
- **Vercel 部署**：⚠️ Vercel serverless 不能写本地文件，需要把 `public/generated/` 改成 S3 / 火山 TOS / Cloudflare R2 之类对象存储
- **自托管 Node 服务器**：`npm run build && npm start` 即可。建议用 PM2 守护，并配 cron 每天凌晨调用 `/api/topics/refresh` 自动抓今日热点

中文字幕烧录需要服务器装中文字体：

```bash
sudo apt install -y fonts-noto-cjk
# 或下载 NotoSansSC-Regular.otf 放项目下
echo "SUBTITLE_FONT=/path/to/NotoSansSC-Regular.otf" >> .env.local
```

---

## 13. 下一步

- 想做"长片"？把 `JimengVideoProvider` 接进 pipeline，每段直接用即梦 i2v 出视频片段而不是静帧
- 想要"动态分镜"？看火山引擎 docs 的 **首尾帧** 模式（`docs/85621/1802721`）
- 角色稳定性还不够？加一步"先生成角色立绘 → 后续每帧用 i2v"

参考链接：
- [即梦图片 4.0](https://www.volcengine.com/docs/85621/1817045)
- [视频 3.0 720P 运镜](https://www.volcengine.com/docs/85621/1785201)
- [视频 3.0 1080P 首尾帧](https://www.volcengine.com/docs/85621/1802721)
- [快速入门](https://www.volcengine.com/docs/85621/1995636)
- [官方签名 demo](https://github.com/volcengine/volc-openapi-demos)
- [Node SDK](https://github.com/volcengine/volc-sdk-nodejs)
