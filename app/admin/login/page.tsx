"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      // Demo admin credentials
      if (email.toLowerCase() === "admin@innovativealuminum.com" && password === "admin123") {
        const adminData = {
          name: "Mike Victory",
          email: "admin@innovativealuminum.com",
          role: "admin",
        };
        localStorage.setItem("ias_admin", JSON.stringify(adminData));
        router.push("/admin/dashboard");
      } else {
        setError("Invalid admin credentials. Try admin@innovativealuminum.com / admin123");
        setLoading(false);
      }
    }, 600);
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <p className="eyebrow text-gold mb-2">IAS · Internal</p>
            <h1 className="font-heading text-3xl font-bold text-cream">Admin Console</h1>
          </Link>
        </div>

        <div className="bg-cream p-8 shadow-2xl">
          <h2 className="font-heading text-xl font-bold mb-6">Sign in to admin</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="eyebrow text-stone-600 block mb-2">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-stone-300 px-4 py-3 font-body focus:outline-none focus:border-gold transition-colors"
                placeholder="admin@innovativealuminum.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="eyebrow text-stone-600 block mb-2">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-stone-300 px-4 py-3 font-body focus:outline-none focus:border-gold transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-sm font-body text-red-900">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full text-sm"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-stone-200">
            <p className="text-xs font-body text-stone-500 mb-1 uppercase tracking-wider">Demo Credentials</p>
            <p className="text-xs font-body text-stone-700">admin@innovativealuminum.com</p>
            <p className="text-xs font-body text-stone-700">admin123</p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/dealers/login" className="text-xs font-body text-cream/50 hover:text-gold transition-colors uppercase tracking-wider">
            ← Dealer Login
          </Link>
        </div>
      </div>
    </div>
  );
}
