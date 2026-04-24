"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Demo dealers — emails dealer1@test.com through dealer30@test.com
// All use the same password for simplicity.
const DEMO_PASSWORD = "password123";

function isValidDealerEmail(email: string): { valid: boolean; name: string } {
  const match = email.toLowerCase().match(/^dealer(\d{1,2})@test\.com$/);
  if (!match) return { valid: false, name: "" };
  const num = parseInt(match[1], 10);
  if (num < 1 || num > 30) return { valid: false, name: "" };
  return { valid: true, name: `Dealer ${num}` };
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const check = isValidDealerEmail(email);

    // Also accept the original test credentials
    if (email === "dealer@test.com" && password === DEMO_PASSWORD) {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "ias_dealer",
          JSON.stringify({ name: "Test Dealer", email: email })
        );
      }
      router.push("/dealers/dashboard");
      return;
    }

    if (check.valid && password === DEMO_PASSWORD) {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "ias_dealer",
          JSON.stringify({ name: check.name, email: email })
        );
      }
      router.push("/dealers/dashboard");
      return;
    }

    setError("Invalid email or password. Try dealer1@test.com (through dealer30) / password123");
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

          {error && (
            <p className="text-sm text-red-600 font-body">{error}</p>
          )}

          <button type="submit" className="btn-gold w-full">
            Sign In
          </button>

          <div className="border-t border-stone-200 pt-6 text-center space-y-2">
            <p className="text-sm text-stone-600 font-body">
              Demo credentials:
            </p>
            <p className="font-mono text-sm text-ink">
              dealer1@test.com  →  dealer30@test.com
            </p>
            <p className="font-mono text-sm text-ink">
              Password: password123
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
