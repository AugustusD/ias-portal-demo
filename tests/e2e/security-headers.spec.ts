import { test, expect } from "@playwright/test";

/**
 * Security header contract — the headers configured in
 * next.config.mjs must keep landing on every response. These exist
 * to defend against clickjacking, MIME sniffing, referrer leakage,
 * and unwanted browser feature access. If someone removes them
 * (e.g. while debugging an iframe issue) this test catches it on
 * the PR before it ships.
 */

const PATHS_TO_CHECK = ["/", "/login", "/forgot-password", "/training"];

for (const path of PATHS_TO_CHECK) {
  test(`security headers present on ${path}`, async ({ request }) => {
    const res = await request.fetch(path);
    const headers = res.headers();

    // Clickjacking defense — the portal has no legitimate iframe use.
    expect(headers["x-frame-options"]?.toLowerCase()).toBe("deny");

    // MIME sniffing defense.
    expect(headers["x-content-type-options"]?.toLowerCase()).toBe("nosniff");

    // Don't leak full URL to cross-origin referrers.
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");

    // Disable browser features we don't use. Specifically check that
    // camera/microphone/geolocation are disabled. The exact value
    // syntax can vary slightly (e.g. trailing space) so we substring-match.
    const permissions = headers["permissions-policy"] || "";
    expect(permissions, `permissions-policy missing on ${path}`).toMatch(/camera=\(\)/);
    expect(permissions).toMatch(/microphone=\(\)/);
    expect(permissions).toMatch(/geolocation=\(\)/);
  });
}
