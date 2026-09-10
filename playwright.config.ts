import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 1, // sanctioned shared-host allowance
  timeout: 60_000, // per-test floor
  expect: { timeout: 15_000 }, // web-first assertion floor
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 15_000,
    permissions: ["microphone"],
    launchOptions: {
      args: [
        "--no-sandbox",
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
    },
  },
  webServer: {
    // Production build served by vite preview (never a dev server). Preview
    // emits the same COOP/COEP/CORP/CSP header set as nginx (see vite.config).
    command: `npm run build && npm run preview -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { NODE_ENV: "production", NODE_OPTIONS: "--max-old-space-size=2048" },
  },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] } }],
});
