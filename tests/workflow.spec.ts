import { expect, test } from "@playwright/test";

test("creates a comic short and unlocks four-platform distribution", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: /确认这个理论/ })).toBeVisible();
  await page.getByRole("button", { name: /确认这个理论/ }).click();

  const hookInput = page.getByLabel("3 秒钩子脚本文案");
  await expect(hookInput).toBeEditable();
  await hookInput.fill("测试脚本：这个热点真正重要的不是站队，而是看见默认规则。");

  await page.getByRole("button", { name: /确认脚本/ }).click();
  await expect(page.getByText("脚本已确认。这里的旁白已经同步使用你的最新改稿。")).toBeVisible();

  await page.getByRole("button", { name: /确认分镜/ }).click();
  await expect(page.getByRole("button", { name: /快速预览（浏览器）/ })).toBeEnabled();

  await page.getByRole("button", { name: /快速预览（浏览器）/ }).click();
  await expect(page.getByRole("link", { name: /下载视频文件/ })).toBeVisible({ timeout: 80_000 });

  await expect(page.getByRole("button", { name: /一键准备四平台分发/ })).toBeEnabled();
  await expect(page.getByRole("button", { name: /一键准备小红书发布/ })).toBeEnabled();
  await expect(page.getByRole("button", { name: /一键准备抖音发布/ })).toBeEnabled();
  await expect(page.getByRole("button", { name: /一键准备视频号发布/ })).toBeEnabled();
  await expect(page.getByRole("button", { name: /一键准备快手发布/ })).toBeEnabled();
});
