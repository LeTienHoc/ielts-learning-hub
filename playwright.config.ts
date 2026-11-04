import { existsSync } from "node:fs"

import { defineConfig, devices } from "@playwright/test"

// E2E tests need the local Supabase stack (`pnpm db:start`) and .env.local (`pnpm env:local`).
if (existsSync(".env.local")) process.loadEnvFile(".env.local")

const PORT = 3100
const baseURL = `http://localhost:${PORT}`
export const AUTH_STATE = "playwright/.auth/learner.json"

const desktop = { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    // Creates and signs in a confirmed learner once; other projects reuse the session.
    { name: "setup", testMatch: /auth\.setup\.ts/, use: desktop },
    // Sign-up, sign-in, password reset and account deletion start signed out.
    { name: "auth-flows", testMatch: /auth\.spec\.ts/, use: desktop },
    {
      name: "desktop",
      testIgnore: /auth\.(setup|spec)\.ts/,
      dependencies: ["setup"],
      use: { ...desktop, storageState: AUTH_STATE },
    },
    {
      name: "mobile",
      testIgnore: /auth\.(setup|spec)\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Pixel 7"], storageState: AUTH_STATE },
    },
  ],
  // Tests run against a production build for realistic behaviour.
  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
})
