"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const PENDING_SIGNUP_KEY = "ias_pending_signup";

type DealerInfo = {
  id: string;
  company_name: string;
  location: string | null;
};

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;

  const [dealer, setDealer] = useState<DealerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenError, setTokenError] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [registered, setRegistered] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      if (!token) {
        setTokenError("Missing registration token.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc("get_dealer_by_token", { p_token: token });
      if (error || !data || data.length === 0) {
        setTokenError("This invitation link is invalid or has expired.");
        setLoading(false);
        return;
      }
      setDealer(data[0] as DealerInfo);

      // Prefill from localStorage if the form-submitter is the one registering
      const stored = typeof window !== "undefined" ? localStorage.getItem(PENDING_SIGNUP_KEY) : null;
      if (stored) {
        try {
          const info = JSON.parse(stored);
          if (info.contactName) setFullName(info.contactName);
          if (info.email) setEmail(info.email);
        } catch {}
      }

      setLoading(false);
    }
    load();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");

    if (password.length < 6) {
      setSubmitError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError("Passwords don't match.");
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          registration_token: token,
        },
      },
    });

    setSubmitting(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem(PENDING_SIGNUP_KEY);
    }

    if (data.session) {
      setRegistered(true);
    } else {
      setNeedsConfirmation(true);
    }
  }

  function handleCopyLink() {
    const url = typeof window !== "undefined" ? `${window.location.origin}/dealers/register/${token}` : "";
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="section-container section-padding">
        <p className="text-stone-600">Loading...</p>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="section-container section-padding">
        <div className="max-w-md mx-auto text-center">
          <p className="eyebrow text-stone-500 mb-3">Invalid Link</p>
          <h1 className="font-heading text-3xl font-bold mb-3">This link doesn&apos;t work.</h1>
          <p className="font-body text-stone-600 mb-6">{tokenError}</p>
          <Link href="/dealers/training" className="btn-gold text-xs px-6 py-3">Start Onboarding →</Link>
        </div>
      </div>
    );
  }

  if (needsConfirmation) {
    return (
      <div className="section-container section-padding">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-5">
            <svg width="32" height="32" viewBox="0 0 20 20" fill="none">
              <path d="M3 7L10 12L17 7M3 6V14C3 14.55 3.45 15 4 15H16C16.55 15 17 14.55 17 14V6C17 5.45 16.55 5 16 5H4C3.45 5 3 5.45 3 6Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="eyebrow text-gold mb-2">Check your email</p>
          <h1 className="font-heading text-3xl font-bold mb-3">Confirm to continue.</h1>
          <p className="font-body text-stone-600 mb-6">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then return here to log in.
          </p>
          <Link href="/dealers/login" className="btn-gold text-xs px-6 py-3">Go to Login</Link>
        </div>
      </div>
    );
  }

  if (registered && dealer) {
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/dealers/register/${token}` : "";
    return (
      <div className="section-container section-padding">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-5">
              <svg width="36" height="36" viewBox="0 0 20 20" fill="none">
                <path d="M5 10L9 14L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="eyebrow text-gold mb-2">Welcome to IAS</p>
            <h1 className="font-heading text-4xl font-bold mb-3">You&apos;re all set, {fullName}.</h1>
            <p className="font-body text-stone-600">
              Your account at <strong>{dealer.company_name}</strong> is ready.
            </p>
          </div>

          <div className="bg-cream-dark border-l-4 border-gold p-6 mb-6">
            <p className="eyebrow text-gold mb-2">Invite your coworkers</p>
            <h3 className="font-heading text-xl font-bold mb-2">Share this link with your team.</h3>
            <p className="font-body text-sm text-stone-700 mb-4">
              Anyone at {dealer.company_name} who clicks this link can create their own login and join your team. They&apos;ll see the same leads, tools, and warranty registration.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 border border-stone-300 px-3 py-2 font-mono text-sm bg-white"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopyLink}
                className="btn-gold text-xs px-5 py-2 whitespace-nowrap"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => router.push("/dealers/dashboard")}
              className="btn-outline-dark text-xs px-6 py-3"
            >
              Continue to Dashboard →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container section-padding">
      <div className="max-w-md mx-auto">
        <p className="eyebrow text-gold mb-3">You&apos;ve been invited</p>
        <h1 className="font-heading text-4xl font-bold mb-2">Join {dealer?.company_name}.</h1>
        <p className="font-body text-stone-600 mb-8">
          Create your login to access leads, tools, and the full IAS dealer network alongside your team.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="fullName" className="eyebrow text-stone-600 block mb-1">Full Name *</label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-stone-300 px-4 py-3 font-body bg-white"
            />
          </div>

          <div>
            <label htmlFor="email" className="eyebrow text-stone-600 block mb-1">Email *</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-stone-300 px-4 py-3 font-body bg-white"
            />
          </div>

          <div>
            <label htmlFor="password" className="eyebrow text-stone-600 block mb-1">Password *</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full border border-stone-300 px-4 py-3 font-body bg-white"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="eyebrow text-stone-600 block mb-1">Confirm Password *</label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-stone-300 px-4 py-3 font-body bg-white"
            />
          </div>

          {submitError && <p className="text-sm text-red-600 font-body">{submitError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="btn-gold w-full"
          >
            {submitting ? "Creating account..." : "Create my account"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-stone-200 text-center">
          <p className="font-body text-sm text-stone-600">
            Already have an account?{" "}
            <Link href="/dealers/login" className="text-gold hover:text-gold-hover underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
