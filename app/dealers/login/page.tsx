"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      setError(authError?.message ?? "Invalid email or password.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email, role")
      .eq("id", authData.user.id)
      .single();

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
      router.push("/dealers/dashboard");
    }
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-stone-300 bg-white focus:outline-none focus:border-gold"
              placeholder="dealer1@test.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-body font-semibold mb-2 uppercase tracking-wider">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-stone-300 bg-white focus:outline-none focus:border-gold"
              placeholder="password123"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600 font-body">{error}</p>}

          <button type="submit" disabled={loading} className="btn-gold w-full">
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="border-t border-stone-200 pt-6 text-center space-y-2">
            <p className="text-sm text-stone-600 font-body">Test credentials:</p>
            <p className="font-mono text-sm text-ink font-bold">admin@innovativealuminum.com / admin123</p>
            <p className="font-mono text-sm text-ink">dealer1@test.com / password123</p>
            <p className="font-mono text-sm text-ink">dealer2@test.com / password123</p>
          </div>
        </form>
      </div>
    </div>
  );
}
