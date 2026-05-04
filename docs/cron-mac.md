# 每日凌晨自动抓热点（macOS launchd）

让你的 Mac 每天早上 6 点自动调一次 `/api/topics/refresh`，省得手动点。

## 前提条件（重要）

- Mac 那个时段必须**醒着**（不在睡眠或关机）
- `npm run dev` 必须**正在跑**（建议在终端 tab 1 长期开着）
- `docker compose up -d` 已经跑过（xhs-toolkit / trend-radar 容器在运行）
- 项目能在 http://localhost:3000 访问

如果以上有任何一项不满足，那个时间点就抓不到。

> 真正 24h 无人值守要部署到云端。这个本地方案适合：「我每天 7 点起床，刚开电脑就有新鲜热点等着」。

## 安装步骤

### 1. 复制 plist 文件到 LaunchAgents 目录

```bash
cd ~/solo-company-comic-trend-studio
cp docs/cron/com.solo.comic.refresh.plist ~/Library/LaunchAgents/
```

### 2. 加载它

```bash
launchctl load ~/Library/LaunchAgents/com.solo.comic.refresh.plist
```

没有任何输出 = 加载成功。

### 3. 验证已注册

```bash
launchctl list | grep solo
```

应该看到一行：

```
-       0       com.solo.comic.refresh
```

中间那个 `0` 是上次退出码（`-` 是还没跑过）。

### 4. 立即手动跑一次（不等到第二天 6 点）

```bash
launchctl start com.solo.comic.refresh
sleep 3
cat /tmp/solo-comic-refresh.out
```

你应该看到一段 JSON，包含 `"topics":[...]` 和 `"perPlatform":[...]`。

如果是空：检查 `/tmp/solo-comic-refresh.err` 看错误。

---

## 修改时间

如果不想 6 点跑，编辑 `~/Library/LaunchAgents/com.solo.comic.refresh.plist`，找到这一段：

```xml
<key>StartCalendarInterval</key>
<dict>
  <key>Hour</key><integer>6</integer>
  <key>Minute</key><integer>0</integer>
</dict>
```

改完之后必须 reload：

```bash
launchctl unload ~/Library/LaunchAgents/com.solo.comic.refresh.plist
launchctl load ~/Library/LaunchAgents/com.solo.comic.refresh.plist
```

要一天多跑几次？把 `StartCalendarInterval` 改成数组：

```xml
<key>StartCalendarInterval</key>
<array>
  <dict><key>Hour</key><integer>6</integer><key>Minute</key><integer>0</integer></dict>
  <dict><key>Hour</key><integer>12</integer><key>Minute</key><integer>0</integer></dict>
  <dict><key>Hour</key><integer>20</integer><key>Minute</key><integer>0</integer></dict>
</array>
```

每天 6 点 / 12 点 / 20 点各跑一次。

---

## 卸载

```bash
launchctl unload ~/Library/LaunchAgents/com.solo.comic.refresh.plist
rm ~/Library/LaunchAgents/com.solo.comic.refresh.plist
```

---

## 排错

### 看不到任何输出

```bash
ls -la /tmp/solo-comic-refresh.*
```

如果两个文件都是 0 字节 = 任务还没被触发。检查：
- `launchctl list | grep solo` 是不是真的注册了
- 现在距离 6:00 还有多久

### 错误日志显示 `Connection refused`

`npm run dev` 没在跑。打开终端 tab 1 起服务。

### 错误日志显示 `port 3000 is busy` 或类似

你的 dev server 跑在别的端口。改 plist 里的 URL 端口。

### Mac 睡眠期间没跑

正常。launchd 默认不会唤醒睡眠的 Mac。如需唤醒，要在「系统设置 → 电池 → 选项 → 在为电源时唤醒以便网络访问」打开（仅适用于通电时）。

或者更彻底地：迁到云端用 GitHub Actions cron 或自托管服务器，本文档不展开。

---

## 同时跑 dev server 的稳妥姿势

推荐用 `pm2`（Node 进程守护，开机自启）：

```bash
npm install -g pm2
cd ~/solo-company-comic-trend-studio
pm2 start npm --name solo-comic -- run dev
pm2 startup        # 按提示执行 sudo 命令一次，开机自启
pm2 save
```

之后即使你重启 Mac、关掉所有终端，dev server 也会一直在 3000 端口跑着，配合 launchd 定时刷热点就稳了。

停止：`pm2 stop solo-comic`
查看日志：`pm2 logs solo-comic`
