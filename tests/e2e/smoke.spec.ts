import { test, expect } from "@playwright/test";

/**
 * Smoke tests — every public route loads without error.
 *
 * These are the canary tests: if any of these break, something is
 * fundamentally wrong with the build or runtime. Keep them broad and
 * cheap — one assertion per route, no clicking around. Anything
 * deeper goes in a focused spec.
 *
 * Why include /admin/dashboard and the gated routes here even though
 * they redirect when unauthenticated? Because we want to catch the
 * case where they crash (500) instead of redirecting cleanly. A 200
 * or a redirect both mean "the route exists"; a 500 means we shipped
 * a broken page.
 */

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/training",
  "/leads",
  "/resources",
  "/tools/calculator",
  "/tools/order-sheets",
  "/tools/brochure",
  "/admin/dashboard",
];

for (const path of PUBLIC_ROUTES) {
  test(`route ${path} loads without error`, async ({ page }) => {
    // Collect any console errors so a "200 OK with red-screen JS" doesn't
    // pass silently. We exclude expected Supabase auth noise (the page
    // legitimately fails to fetch a session when no cookie exists).
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (/auth.*session.*missing/i.test(text)) return;
        if (/Failed to load resource/.test(text)) return;
        consoleErrors.push(text);
      }
    });

    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    // Anything in the 2xx-3xx range is fine. 4xx/5xx fail the test.
    expect(response, `no response for ${path}`).not.toBeNull();
    expect(response!.status(), `bad status for ${path}`).toBeLessThan(400);

    // Give client-side React a moment to throw any boot-time errors.
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});

    expect(consoleErrors, `console errors on ${path}`).toEqual([]);
  });
}

test("guest dashboard at / renders the version badge", async ({ page }) => {
  await page.goto("/");
  // The version badge lives in lib/version.ts and renders via
  // {VERSION_LABEL} in the (authenticated)/page.tsx hero. If the
  // badge is missing, either the import broke or the dashboard
  // didn't render — both are critical regressions.
  // Wait for hydration so client-rendered content appears.
  await expect(page.getByText(/v\d+\.\d+\.\d+/i).first()).toBeVisible({ timeout: 10_000 });
});

test("guest dashboard shows the locked tile overlay", async ({ page }) => {
  await page.goto("/");
  // Guest dealers should see at least one "Complete Onboarding to
  // Access" overlay on the gated tool tiles. If this string is
  // missing, the guest-mode gating broke and guests can click
  // through to gated tools.
  await expect(
    page.getByText(/Complete Onboarding to Access/i).first()
  ).toBeVisible({ timeout: 10_000 });
});

test("guest dashboard does not leak admin-set discount in tool URLs", async ({ page }) => {
  // Tool tile URLs should NOT include a #d= hash for guests. This is
  // the boundary we drew in app/(authenticated)/page.tsx — guests
  // get the bare URL, only approved dealers with a set discount get
  // the hash. A regression here would expose discount data to guests.
  await page.goto("/");
  const calculatorLinks = await page
    .locator('a[href*="infinity.innovativealuminum.com"]')
    .evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).href));
  for (const href of calculatorLinks) {
    expect(href, `guest should get bare URL, got ${href}`).not.toMatch(/#d=/);
  }
});
