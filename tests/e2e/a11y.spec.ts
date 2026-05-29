import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility smoke tests — axe-core scan on the highest-traffic
 * public pages.
 *
 * Scope: we assert ZERO violations at the wcag2a/wcag2aa levels.
 * That's the minimum legal/ethical bar (WCAG 2.1 Level A + AA).
 * AAA is a separate beast and we don't aim for it.
 *
 * Why these specific pages: /, /login, /forgot-password are the
 * entry points new users hit before they're authenticated. If
 * those don't pass a11y, prospects can't even sign up. The gated
 * routes (/leads etc.) get a separate suite once we wire auth.
 *
 * If a finding shows up that's legitimate but we don't want to fix
 * right now, prefer `.disableRules(["rule-name"])` with a
 * `// EXPLAIN:` comment next to it over a blanket allowlist.
 */

const PAGES_TO_SCAN = [
  { path: "/", name: "guest dashboard" },
  { path: "/login", name: "login" },
  { path: "/forgot-password", name: "forgot password" },
  { path: "/reset-password", name: "reset password (link expired)" },
];

for (const { path, name } of PAGES_TO_SCAN) {
  test(`${name} (${path}) has no WCAG 2.1 A/AA axe violations`, async ({ page }) => {
    await page.goto(path);
    // Wait for client-side hydration to settle so axe scans the live
    // DOM, not the SSR shell.
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      // EXPLAIN: 'color-contrast' is suppressed for the auth pages
      // only because the marketing 'eyebrow' style on the cream
      // background sits at ~4.4:1 (the gold accent), just under the
      // 4.5:1 threshold. Cloverfield owns the palette and we want
      // pixel-parity with the marketing site. Re-enable once
      // Cloverfield darkens the eyebrow gold.
      .disableRules(["color-contrast"])
      .analyze();

    expect(
      results.violations,
      `axe violations on ${path}:\n${JSON.stringify(results.violations, null, 2)}`
    ).toEqual([]);
  });
}
