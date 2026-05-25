"use client";

/**
 * Reset Password — the page Supabase sends users to from the reset email.
 *
 * Flow:
 *   1. User clicks the link in their email → Supabase verifies the recovery
 *      token and emits a PASSWORD_RECOVERY auth event on this page load.
 *   2. While in recovery mode the user has a session that ONLY permits
 *      updateUser(password). We set the new password.
 *   3. After success we sign the user out (so they re-authenticate fresh) and
 *      send them back to /login.
 *
 * Edge cases handled:
 *   - User hits this URL directly with no token → "Recovery link expired"
 *   - Token already used → same message (Supabase returns no session)
 *   - Network failure during updateUser → preserves the recovery session so
 *     they can retry without re-clicking the email
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY immediately after the recovery URL is
    // parsed and the recovery session is set up. We listen so we know the
    // token was actually valid before showing the form.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setTokenValid(true);
        setReady(true);
      }
    });

    // If the recovery event already fired before this listener attached
    // (rare but possible on slow hydration), fall back to checking the
    // existing session.
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setTokenValid(true);
      setReady(true);
    })();

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    // Sign out so the dealer logs in fresh with the new password. This also
    // invalidates the recovery session so the link can't be reused.
    await supabase.auth.signOut();
    setSuccess(true);
    setTimeout(() => router.push("/login"), 1800);
  }

  if (!ready) {
    return <div className="section-container section-padding"><p className="text-stone-600">Loading...</p></div>;
  }

  if (!tokenValid) {
    return (
      <div className="section-container section-padding">
        <div className="max-w-md mx-auto">
          <p className="eyebrow text-gold mb-4">Dealer Portal</p>
          <h1 className="text-4xl font-heading font-bold mb-4">Link expired.</h1>
          <p className="font-body text-stone-700 mb-8">
            This password reset link is invalid or has already been used. Please request a new one.
          </p>
          <Link href="/forgot-password" className="btn-gold w-full">Request New Link</Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="section-container section-padding">
        <div className="max-w-md mx-auto">
          <p className="eyebrow text-gold mb-4">Dealer Portal</p>
          <h1 className="text-4xl font-heading font-bold mb-4">Password updated.</h1>
          <p className="font-body text-stone-700 mb-8">
            Taking you to the sign-in page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container section-padding">
      <div className="max-w-md mx-auto">
        <p className="eyebrow text-gold mb-4">Dealer Portal</p>
        <h1 className="text-4xl font-heading font-bold mb-8">Set a new password.</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-body font-semibold mb-2 uppercase tracking-wider">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-stone-300 bg-white focus:outline-none focus:border-gold"
              placeholder="At least 8 characters"
              minLength={8}
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm font-body font-semibold mb-2 uppercase tracking-wider">
              Confirm Password
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-3 border border-stone-300 bg-white focus:outline-none focus:border-gold"
              placeholder="Re-enter password"
              minLength={8}
              required
            />
          </div>

          {error && <p className="text-sm text-red-600 font-body">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-gold w-full">
            {submitting ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
