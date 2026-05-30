"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // If already logged in, redirect to the right dashboard
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setCheckingSession(false);
        return;
      }
      // maybeSingle: a session without a matching profiles row shouldn't crash
      // the checkSession effect — we just fall through to dealer dashboard,
      // which will gate further or surface a clean error.
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();
      if (profile?.role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/");
      }
    }
    checkSession();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      // Map all auth errors to the same string so the response doesn't
      // distinguish "wrong password on a known email" from "no such user"
      // — supabase's raw message reveals which case it is via different
      // codes (invalid_credentials vs email_not_confirmed vs over_email_send_rate_limit).
      // The user-existence leak via these codes was flagged in round-3 audit.
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email, role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      setError("Account exists but profile not found. Contact IAS support.");
      setLoading(false);
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "ias_dealer",
        JSON.stringify({
          name: profile.full_name ?? "Dealer",
          email: profile.email ?? email,
        })
      );
    }

    if (profile.role === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/");
    }
  }

  if (checkingSession) {
    return (
      <div className="section-container section-padding">
        <p className="text-stone-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="section-container section-padding">
      <div className="max-w-md mx-auto">
        <p className="eyebrow text-gold mb-4">Dealer Portal</p>
        <h1 className="text-4xl font-heading font-bold mb-8">Sign in.</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-body font-semibold mb-2 uppercase tracking-wider">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-stone-300 bg-white focus:outline-none focus:border-gold"
              placeholder="you@yourcompany.com"
              required
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-body font-semibold uppercase tracking-wider">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs font-body text-stone-600 hover:text-gold underline">
                Forgot?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-stone-300 bg-white focus:outline-none focus:border-gold"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600 font-body">{error}</p>}

          <button type="submit" disabled={loading} className="btn-gold w-full">
            {loading ? "Signing in..." : "Sign In"}
          </button>

        </form>
      </div>
    </div>
  );
}
