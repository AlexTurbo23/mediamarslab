import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config();

const baseURL =
  process.env.BASE_URL || "https://qa-a.recruitment.mediamarslab.com";

export default defineConfig({
  testDir: "./tests",
  // Specs that share server state declare test.describe.configure({ mode: "serial" })
  // internally; everything else runs in parallel.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // CI: workers=1 — shared remote server has rate limits (429) under parallel load.
  workers: process.env.CI ? 1 : 4,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [["html", { open: "never" }], ["line"], ["allure-playwright"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  outputDir: "test-results",
});
