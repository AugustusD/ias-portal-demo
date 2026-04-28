"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const router = useRouter();
  const [isGuest, setIsGuest] = useState(true);
  const [dealerName, setDealerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [completedModules, setCompletedModules] = useState(0);
  const [totalModules] = useState(5);
  const [activeLeadsCount, setActiveLeadsCount] = useState(0);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Guest mode: read onboarding progress from localStorage
        setIsGuest(true);
        const stored = typeof window !== "undefined" ? localStorage.getItem("ias_guest_onboarding_progress") : null;
        if (stored) {
          try {
            const progress = JSON.parse(stored);
            setCompletedModules(Array.isArray(progress) ? progress.length : 0);
          } catch {
            setCompletedModules(0);
          }
        }
        setLoading(false);
        return;
      }

      // Logged in
      setIsGuest(false);
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, dealer_id")
        .eq("id", session.user.id)
        .single();
      setDealerName(profile?.full_name || "Dealer");

      const { data: progress } = await supabase
        .from("training_progress")
        .select("module_id")
        .eq("user_id", session.user.id);
      setCompletedModules(progress?.length || 0);
      setAuthorized((progress?.length || 0) === totalModules);

      const { data: leads } = await supabase
        .from("leads")
        .select("id, stage")
        .in("stage", ["new", "accepted", "bid_submitted"]);
      setActiveLeadsCount(leads?.length || 0);

      setLoading(false);
    }
    load();
  }, [router, totalModules]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/dealers/dashboard");
  }

  if (loading) {
    return <div className="section-container section-padding"><p className="text-stone-600">Loading...</p></div>;
  }

  const onboardingProgress = (completedModules / totalModules) * 100;

  return (
    <div className="bg-cream min-h-screen">
      <div className="sticky top-0 z-30 bg-cream border-b border-stone-200">
        <div className="section-container py-5 flex items-center justify-between">
          <div>
            <p className="eyebrow text-gold">IAS Dealer Portal</p>
            <p className="font-heading text-lg font-bold">Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            {isGuest ? (
              <Link href="/dealers/login" className="btn-gold text-xs px-5 py-2.5">Sign In</Link>
            ) : (
              <>
                <p className="text-sm font-body">
                  <span className="text-stone-500">Signed in as</span>
                  <span className="ml-2 font-semibold">{dealerName}</span>
                </p>
                <button onClick={handleLogout} className="text-xs font-body uppercase tracking-wider border border-stone-300 hover:border-gold hover:text-gold px-4 py-2 transition-colors">
                  Log Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="section-container pt-16 pb-12">
        {isGuest ? (
          <>
            <p className="eyebrow text-gold mb-3">Welcome</p>
            <h1 className="text-5xl md:text-6xl font-heading font-bold mb-4">
              You&apos;re browsing as a guest.
            </h1>
            <p className="font-body text-lg text-stone-600 max-w-2xl mb-3">
              Start with the Onboarding modules to learn about IAS, our products, and how to become an authorized dealer.
            </p>
            <p className="font-body text-base text-stone-500 max-w-2xl">
              Already a partner?{" "}
              <Link href="/dealers/login" className="text-gold underline hover:text-gold-hover">Sign in</Link>{" "}
              to access your tools, leads, and warranty registration.
            </p>
          </>
        ) : (
          <>
            <p className="eyebrow text-gold mb-3">Welcome back</p>
            <h1 className="text-5xl md:text-6xl font-heading font-bold mb-4">
              {dealerName}.
            </h1>
            {authorized ? (
              <div className="inline-flex items-center gap-2 bg-ink text-cream px-4 py-1.5 mb-6">
                <span className="w-2 h-2 rounded-full bg-gold"></span>
                <span className="text-xs font-body font-bold uppercase tracking-widest">Authorized Partner</span>
              </div>
            ) : (
              <p className="font-body text-lg text-stone-600 max-w-2xl mb-6">
                {completedModules} of {totalModules} onboarding modules complete.{" "}
                <Link href="/dealers/training" className="text-gold underline">Continue →</Link>
              </p>
            )}
          </>
        )}
      </div>

      <div className="section-container pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Onboarding tile — gold highlighted, especially prominent for guests */}
          <Link
            href="/dealers/training"
            className={`group relative block p-8 transition-all ${
              isGuest
                ? "bg-gold text-ink hover:bg-gold-hover shadow-lg ring-2 ring-gold ring-offset-4 ring-offset-cream"
                : "bg-white border border-stone-200 hover:border-gold"
            }`}
          >
            {isGuest && (
              <span className="absolute -top-3 left-6 bg-ink text-gold px-3 py-1 text-xs font-body font-bold uppercase tracking-widest">
                Start Here →
              </span>
            )}
            <p className={`eyebrow mb-3 ${isGuest ? "text-ink/70" : "text-stone-500"}`}>Module {completedModules + 1} of {totalModules}</p>
            <h3 className={`font-heading text-2xl font-bold mb-2 ${isGuest ? "text-ink" : "text-ink"}`}>Onboarding</h3>
            <p className={`font-body text-sm mb-4 ${isGuest ? "text-ink/80" : "text-stone-600"}`}>
              {isGuest
                ? "Learn about IAS, our products, and become an authorized dealer."
                : `${completedModules}/${totalModules} modules complete.`}
            </p>
            <div className={`w-full h-1 ${isGuest ? "bg-ink/20" : "bg-stone-200"} overflow-hidden mb-3`}>
              <div className={`h-full ${isGuest ? "bg-ink" : "bg-gold"}`} style={{ width: `${onboardingProgress}%` }}></div>
            </div>
            <p className={`text-xs font-body font-bold uppercase tracking-widest ${isGuest ? "text-ink" : "text-gold"}`}>
              {completedModules === totalModules ? "✓ All complete" : "Continue →"}
            </p>
          </Link>

          {/* Tools tile */}
          {isGuest ? (
            <div className="block p-8 bg-stone-100 border border-stone-200 opacity-70 cursor-not-allowed relative">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="absolute top-6 right-6 text-stone-400">
                <rect x="5" y="9" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 9V6.5C7 4.84 8.34 3.5 10 3.5C11.66 3.5 13 4.84 13 6.5V9" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <p className="eyebrow text-stone-400 mb-3">Locked</p>
              <h3 className="font-heading text-2xl font-bold mb-2 text-stone-500">Tools</h3>
              <p className="font-body text-sm text-stone-500 mb-4">Calculator, Order Sheets, and Designer.</p>
              <p className="text-xs font-body font-bold uppercase tracking-widest text-stone-400">Sign in to access</p>
            </div>
          ) : (
            <Link href="/dealers/tools" className="block p-8 bg-white border border-stone-200 hover:border-gold transition-colors">
              <p className="eyebrow text-stone-500 mb-3">Tools</p>
              <h3 className="font-heading text-2xl font-bold mb-2">Tools</h3>
              <p className="font-body text-sm text-stone-600 mb-4">Calculator, Order Sheets, and Designer.</p>
              <p className="text-xs font-body font-bold uppercase tracking-widest text-gold">Open →</p>
            </Link>
          )}

          {/* Leads tile */}
          {isGuest ? (
            <div className="block p-8 bg-stone-100 border border-stone-200 opacity-70 cursor-not-allowed relative">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="absolute top-6 right-6 text-stone-400">
                <rect x="5" y="9" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 9V6.5C7 4.84 8.34 3.5 10 3.5C11.66 3.5 13 4.84 13 6.5V9" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <p className="eyebrow text-stone-400 mb-3">Locked</p>
              <h3 className="font-heading text-2xl font-bold mb-2 text-stone-500">Leads</h3>
              <p className="font-body text-sm text-stone-500 mb-4">Customer leads forwarded from IAS.</p>
              <p className="text-xs font-body font-bold uppercase tracking-widest text-stone-400">Sign in to access</p>
            </div>
          ) : (
            <Link href="/dealers/leads" className="block p-8 bg-white border border-stone-200 hover:border-gold transition-colors">
              <p className="eyebrow text-stone-500 mb-3">{activeLeadsCount} active</p>
              <h3 className="font-heading text-2xl font-bold mb-2">Leads</h3>
              <p className="font-body text-sm text-stone-600 mb-4">Customer leads forwarded from IAS.</p>
              <p className="text-xs font-body font-bold uppercase tracking-widest text-gold">View →</p>
            </Link>
          )}

        </div>

        {isGuest && (
          <div className="mt-12 p-8 bg-ink text-cream">
            <p className="eyebrow text-gold mb-3">Already an IAS dealer?</p>
            <h3 className="font-heading text-2xl font-bold mb-2">Sign in to unlock everything.</h3>
            <p className="font-body text-sm text-cream/80 mb-5 max-w-xl">
              Tools, lead management, warranty registration, and more — available once you sign in with your dealer credentials.
            </p>
            <Link href="/dealers/login" className="btn-gold text-xs px-6 py-3">Sign In</Link>
          </div>
        )}
      </div>
    </div>
  );
}
