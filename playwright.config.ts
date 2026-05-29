import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — E2E suite for the IAS Partner Portal.
 *
 * Key choices and why:
 *
 * - **Run against `next start`, not `next dev`.** Dev-server tests are
 *   fast but miss real production behavior (redirects, headers,
 *   minification, static optimization). We're a low-throughput app —
 *   the extra ~30s for `next build` per CI run is a fair price for
 *   testing the actual artifact that ships.
 *
 * - **Two projects: desktop-chrome + mobile-chrome.** Dealers split
 *   roughly 50/50 phone vs laptop; testing only one platform misses
 *   half the user base. Both run in parallel locally; CI serializes
 *   them inside a single chromium browser install to keep cache size
 *   small.
 *
 * - **No webkit/firefox.** Vercel + Next.js handle browser parity
 *   well, and dealers aren't on those. Adding them later is a
 *   one-line change.
 *
 * - **CI-vs-local reporters.** Locally we want `list` for live
 *   feedback. In CI we want HTML (uploaded as artifact) + the
 *   `github` reporter so failures annotate the PR diff.
 *
 * - **`trace: "on-first-retry"`.** Traces are the killer feature —
 *   on a flaky failure we get a video, network log, and DOM
 *   snapshots. But they're expensive to record, so we only capture
 *   on retry. Failures in CI are auto-retried once.
 *
 * - **`testIgnore: node_modules`.** Defaults are fine but explicit
 *   is clearer for the next person who reads this.
 */

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: ["**/node_modules/**"],

  // Hard timeout per test. Our slowest test (full page load + hydrate)
  // is ~6s; 30s gives generous headroom for slow CI runners.
  timeout: 30_000,

  // Fail the build if a test was accidentally left as test.only.
  // Without this, an only-in-one-test push silently skips everything else.
  forbidOnly: !!process.env.CI,

  // CI retries once on flake. Local runs surface flake immediately so
  // we notice and fix it.
  retries: process.env.CI ? 1 : 0,

  // Parallel locally for speed; serial in CI to keep memory low on
  // the free runner tier.
  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"], ["list"]]
    : [["list"]],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // ~5s for any network call inside a test. Surfaces hung Supabase
    // requests instead of letting the whole test time out at 30s.
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
  },

  projects: [
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],

  // Boots a production build of the portal before running tests.
  // Reuses an existing server if PLAYWRIGHT_BASE_URL is set (so you
  // can point tests at a Vercel preview URL without spinning up a
  // local server).
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run build && npm run start -- -p " + PORT,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
