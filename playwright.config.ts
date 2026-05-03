import { defineConfig, devices } from "@playwright/test";

const chromeExecutablePath =
  process.platform === "darwin" ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" : undefined;

export default defineConfig({
  testDir: "./tests",
  timeout: 120_000,
  expect: {
    timeout: 10_000
  },
  webServer: {
    command: "npm run dev",
    reuseExistingServer: true,
    timeout: 30_000,
    url: "http://localhost:3000"
  },
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: chromeExecutablePath ? { executablePath: chromeExecutablePath } : undefined
      }
    }
  ]
});
