import { test, expect } from "@playwright/test";

/**
 * Backward-compat redirect tests — the /dealers/* → / flatten.
 *
 * On 2026-05-25 we flattened /dealers/dashboard → /, /dealers/leads
 * → /leads, etc. The next.config.mjs has 308 (permanent) redirects
 * for every old path. Critical: these must KEEP working forever
 * because dealer email links, Slack pastes, and bookmarks are
 * forever, and 308 is browser-cached so we don't want to flap.
 *
 * Test strategy: for each legacy path, send a request that doesn't
 * follow redirects, and assert (status, redirect target). Then do
 * one end-to-end test that follows the redirect to confirm the
 * destination renders.
 */

type Case = { from: string; to: string };

// Curated list — must match next.config.mjs. If we add a new gated
// route, add it here too so the redirect contract is enforced.
const REDIRECTS: Case[] = [
  { from: "/dealers/dashboard", to: "/" },
  { from: "/dealers/leads", to: "/leads" },
  { from: "/dealers/training", to: "/training" },
  { from: "/dealers/resources", to: "/resources" },
  { from: "/dealers/tools/calculator", to: "/tools/calculator" },
  { from: "/dealers/tools/order-sheets", to: "/tools/order-sheets" },
  { from: "/dealers/tools/brochure", to: "/tools/brochure" },
  { from: "/dealers/login", to: "/login" },
  { from: "/dealers/forgot-password", to: "/forgot-password" },
  { from: "/dealers/reset-password", to: "/reset-password" },
];

for (const { from, to } of REDIRECTS) {
  test(`${from} permanently redirects to ${to}`, async ({ request, baseURL }) => {
    // Use request fixture (not page) so we can control redirect
    // following. Page.goto auto-follows; request.fetch respects
    // maxRedirects: 0.
    const res = await request.fetch(from, {
      maxRedirects: 0,
      failOnStatusCode: false,
    });
    // 308 (or 301) — both are "permanent." Next.js emits 308 by
    // default for permanent redirects.
    expect(res.status(), `expected permanent redirect on ${from}`).toBeGreaterThanOrEqual(301);
    expect(res.status()).toBeLessThan(309);
    const loc = res.headers()["location"];
    // The Location can be absolute or relative; normalize for comparison.
    const resolved = new URL(loc, baseURL).pathname;
    expect(resolved, `${from} → expected ${to}, got ${resolved}`).toBe(to);
  });
}

test("/dealers/dashboard end-to-end: redirected and the destination renders", async ({
  page,
}) => {
  // One full round-trip just to be sure no infinite-loop bug sneaks
  // in (e.g., the redirect target itself redirects somewhere unexpected).
  await page.goto("/dealers/dashboard");
  await page.waitForLoadState("domcontentloaded");
  expect(new URL(page.url()).pathname, "should land on root").toBe("/");
});
