"use client";

/**
 * Forgot Password — request a password reset email.
 *
 * Why this exists: prior to 2026-05-19 the portal had ZERO recovery path. If a
 * dealer forgot their password their only option was emailing Mike, who would
 * then have to reset it manually in the Supabase dashboard. With 70+ dealers
 * onboarding this was a launch blocker.
 *
 * Security note: we intentionally always show the "check your inbox" success
 * screen, even if the email isn't in the system. Otherwise this becomes a
 * user-enumeration oracle (attacker submits emails, learns which are dealers).
 * Supabase's resetPasswordForEmail already swallows the not-found case
 * silently — we just mirror that on the UI.
 */

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) { setError("Please enter your email address."); return; }
    setError("");
    setSubmitting(true);

    // Build absolute reset URL from window.location — works in prod + previews
    // without having to hardcode a domain. Supabase requires the redirect to
    // be on the configured Site URL allow-list.
    const redirectTo = `${window.location.origin}/reset-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo,
    });

    setSubmitting(false);

    // Per the security note above, surface the SAME UI for success and
    // not-found. Only show errors for actual transport/server failures.
    if (resetError && !/not found/i.test(resetError.message)) {
      setError(resetError.message);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="section-container section-padding">
        <div className="max-w-md mx-auto">
          <p className="eyebrow text-gold mb-4">Dealer Portal</p>
          <h1 className="text-4xl font-heading font-bold mb-4">Check your inbox.</h1>
          <p className="font-body text-stone-700 mb-8">
            If an account exists for <span className="font-semibold">{email}</span>,
            we&apos;ve sent a password reset link. It may take a minute to arrive — also
            check spam.
          </p>
          <Link href="/login" className="btn-gold w-full">Back to Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container section-padding">
      <div className="max-w-md mx-auto">
        <p className="eyebrow text-gold mb-4">Dealer Portal</p>
        <h1 className="text-4xl font-heading font-bold mb-4">Forgot your password?</h1>
        <p className="font-body text-stone-700 mb-8">
          Enter the email you sign in with and we&apos;ll send you a reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-body font-semibold mb-2 uppercase tracking-wider">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-stone-300 bg-white focus:outline-none focus:border-gold"
              placeholder="you@yourcompany.com"
              required
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-red-600 font-body">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-gold w-full">
            {submitting ? "Sending..." : "Send Reset Link"}
          </button>

          <p className="text-sm font-body text-stone-600 text-center">
            {/*
              Inline link must be visually distinguishable from surrounding
              text at all times — WCAG 2.1 SC 1.4.1 + 2.5.8. We use
              `underline font-semibold` always-on (not just on hover) and
              `text-ink` to land above the 4.5:1 contrast threshold against
              the cream background. The Playwright axe a11y suite catches
              regressions here.
            */}
            Remembered it? <Link href="/login" className="text-ink underline font-semibold">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
