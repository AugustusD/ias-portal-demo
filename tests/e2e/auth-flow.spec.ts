import { test, expect } from "@playwright/test";

/**
 * Auth flow tests — login form behavior + forgot-password flow.
 *
 * These tests deliberately do NOT use real credentials. Maintaining
 * a test-user account in the live Supabase project is fragile
 * (someone changes its password, the test breaks; the test data
 * pollutes prod). Instead we exercise the *flows* with bogus inputs
 * and assert the right error / success states fire.
 *
 * Coverage:
 *  - login form validation + Supabase error display
 *  - "Forgot?" link wired up
 *  - forgot-password user-enumeration defense (success screen on
 *    every email, real or not)
 *  - reset-password landing without a token shows "Link expired"
 *  - logged-in users hitting /login get bounced to / (not tested
 *    here — needs a session; covered in the manual smoke matrix)
 */

test("login form rejects bad credentials with a friendly error", async ({ page }) => {
  await page.goto("/login");

  // Wait for the form to be interactive. The login page is a client
  // component that does an initial getSession() check, then renders.
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();

  await page.locator("#email").fill("nobody@example.invalid");
  await page.locator("#password").fill("definitely-not-the-password");
  await page.getByRole("button", { name: /sign in/i }).click();

  // Supabase returns "Invalid login credentials" — we surface it
  // verbatim because login errors are not sensitive (user knows
  // they typed something).
  await expect(page.getByText(/invalid login credentials/i)).toBeVisible({
    timeout: 8_000,
  });

  // The submit button should re-enable so the user can retry.
  await expect(page.getByRole("button", { name: /sign in/i })).toBeEnabled();
});

test("login page has a 'Forgot?' link to /forgot-password", async ({ page }) => {
  await page.goto("/login");
  const forgotLink = page.getByRole("link", { name: /forgot/i });
  await expect(forgotLink).toBeVisible();
  await expect(forgotLink).toHaveAttribute("href", "/forgot-password");
});

test("forgot-password shows success screen even for unknown email (user-enumeration defense)", async ({
  page,
}) => {
  await page.goto("/forgot-password");
  await expect(page.getByRole("heading", { name: /forgot your password/i })).toBeVisible();

  // Bogus email that is definitely not in the system. The flow
  // should STILL show the "check your inbox" screen to avoid
  // leaking which emails are registered.
  await page.locator('input[type="email"]').fill("nobody-here@example.invalid");
  await page.getByRole("button", { name: /send reset link/i }).click();

  await expect(page.getByRole("heading", { name: /check your inbox/i })).toBeVisible({
    timeout: 8_000,
  });
});

test("reset-password without a recovery token shows 'Link expired'", async ({ page }) => {
  // Direct navigation with no hash + no session → the listener never
  // fires PASSWORD_RECOVERY → we should land on the expired screen,
  // not the form. This guards against the page rendering the
  // password form for users who shouldn't be there.
  await page.goto("/reset-password");
  await expect(page.getByRole("heading", { name: /link expired/i })).toBeVisible({
    timeout: 8_000,
  });
  // And there should be a CTA back to /forgot-password.
  await expect(
    page.getByRole("link", { name: /request new link/i })
  ).toHaveAttribute("href", "/forgot-password");
});
