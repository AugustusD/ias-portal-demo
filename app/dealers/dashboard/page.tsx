"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Dealer = { name: string; email: string };

const TRAINING_TOTAL = 5;

// Animated counter hook
function useCountUp(target: number, duration: number = 1200, enabled: boolean = true): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    if (target === 0) { setValue(0); return; }

    const startTime = performance.now();
    let rafId: number;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration, enabled]);

  return value;
}

// Hexagon Authorized Partner badge
function AuthorizedBadge({ authorized, progress }: { authorized: boolean; progress: number }) {
  const fillPercent = authorized ? 100 : progress * 100;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: 96, height: 108 }}>
      <svg width="96" height="108" viewBox="0 0 96 108" className="absolute inset-0">
        <defs>
          <linearGradient id="badgeFill" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#B69A5A" />
            <stop offset="100%" stopColor="#D4B975" />
          </linearGradient>
          <clipPath id="hexClip">
            <polygon points="48,4 88,28 88,80 48,104 8,80 8,28" />
          </clipPath>
        </defs>
        <polygon
          points="48,4 88,28 88,80 48,104 8,80 8,28"
          fill="none"
          stroke={authorized ? "#B69A5A" : "#D6D3CE"}
          strokeWidth="2"
        />
        <g clipPath="url(#hexClip)">
          <rect
            x="0"
            y={108 - (108 * fillPercent) / 100}
            width="96"
            height={(108 * fillPercent) / 100}
            fill="url(#badgeFill)"
            style={{ transition: "all 1s ease-out" }}
          />
        </g>
        <polygon
          points="48,14 78,32 78,76 48,94 18,76 18,32"
          fill="none"
          stroke={authorized ? "#FFFFFF" : "transparent"}
          strokeWidth="1"
          opacity="0.4"
        />
      </svg>

      <div className="relative z-10 flex flex-col items-center justify-center">
        {authorized ? (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M12 21L18 27L28 15" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none" className="text-stone-400">
            <rect x="13" y="18" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="2" />
            <path d="M16 18V14a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [animationsReady, setAnimationsReady] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("ias_dealer") : null;
    if (!stored) { router.push("/dealers/login"); return; }
    let parsedDealer: Dealer;
    try {
      parsedDealer = JSON.parse(stored);
      setDealer(parsedDealer);
    } catch { router.push("/dealers/login"); return; }

    const progressKey = `ias_training_progress_${parsedDealer.email}`;
    const storedProgress = localStorage.getItem(progressKey);
    if (storedProgress) {
      try {
        const parsed = JSON.parse(storedProgress);
        setCompletedCount(Array.isArray(parsed) ? parsed.length : 0);
      } catch {}
    }
    setLoading(false);
    setTimeout(() => setAnimationsReady(true), 150);
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("ias_dealer");
    router.push("/dealers/login");
  }

  const trainingAnimated = useCountUp(completedCount, 900, animationsReady);
  const leadsAnimated = useCountUp(3, 1000, animationsReady);
  const quotesAnimated = useCountUp(7, 1100, animationsReady);
  const quoteValueAnimated = useCountUp(84250, 1400, animationsReady);

  if (loading || !dealer) {
    return <div className="section-container section-padding"><p className="text-stone-600">Loading...</p></div>;
  }

  const trainingPercent = (completedCount / TRAINING_TOTAL) * 100;
  const isAuthorized = completedCount === TRAINING_TOTAL;

  return (
    <div className="section-container section-padding">
      {/* HERO */}
      <div className="mb-12">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 mb-6">
          <div className="flex-1 flex items-start gap-6">
            <div className="hidden sm:block flex-shrink-0 pt-1">
              <AuthorizedBadge authorized={isAuthorized} progress={trainingPercent / 100} />
              <p className="text-[10px] font-body font-bold uppercase tracking-widest text-center mt-2 text-stone-500">
                {isAuthorized ? "Authorized Partner" : "In Training"}
              </p>
            </div>
            <div className="flex-1">
              <p className="eyebrow text-gold mb-3">Dealer Portal</p>
              <h1 className="text-4xl md:text-5xl font-heading font-bold mb-2">
                Welcome back, {dealer.name}.
              </h1>
              <p className="font-body text-stone-600">
                {isAuthorized
                  ? "Authorized Dealer · Full access to all tools and programs."
                  : `Complete ${TRAINING_TOTAL - completedCount} more module${TRAINING_TOTAL - completedCount === 1 ? "" : "s"} to unlock authorized partner status.`}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-outline-dark flex-shrink-0 self-start">
            Log Out
          </button>
        </div>

        {!isAuthorized && (
          <div className="border-t border-stone-200 pt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="eyebrow text-stone-500">Your Path to Authorized Partner</p>
              <p className="text-sm font-body font-semibold">
                <span className="text-ink">{completedCount}</span>
                <span className="text-stone-400"> / {TRAINING_TOTAL} modules</span>
              </p>
            </div>
            <div className="relative w-full h-2 bg-stone-200 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gold transition-all duration-1500 ease-out"
                style={{ width: animationsReady ? `${trainingPercent}%` : "0%" }}
              ></div>
            </div>
          </div>
        )}

        {isAuthorized && (
          <div className="border-t border-stone-200 pt-6">
            <div className="flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="10" fill="#B69A5A" />
                <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="font-body text-sm font-semibold text-ink">
                All 5 training modules complete. You are a certified Authorized Partner.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* TOOLS — full gold swap on hover (reverted per user preference) */}
      <div className="mb-10">
        <div className="flex items-baseline justify-between mb-5">
          <p className="eyebrow text-stone-400">Tools</p>
          <p className="text-xs font-body text-stone-400">Open and use any time</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dealers/tools/calculator" className="group block p-7 bg-ink text-cream hover:bg-gold hover:text-ink transition-colors duration-200">
            <div className="flex items-start justify-between mb-4">
              <p className="eyebrow text-gold group-hover:text-ink">Pricing</p>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gold group-hover:text-ink">
                <path d="M5 15L15 5M15 5H7M15 5V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="font-heading text-2xl font-bold mb-2">Calculator</h3>
            <p className="font-body text-sm opacity-80">Live pricing for Infinity systems.</p>
          </Link>

          <Link href="/dealers/tools/order-sheets" className="group block p-7 bg-ink text-cream hover:bg-gold hover:text-ink transition-colors duration-200">
            <div className="flex items-start justify-between mb-4">
              <p className="eyebrow text-gold group-hover:text-ink">Catalog</p>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gold group-hover:text-ink">
                <path d="M5 15L15 5M15 5H7M15 5V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="font-heading text-2xl font-bold mb-2">Order Sheets</h3>
            <p className="font-body text-sm opacity-80">Full product catalog and order builder.</p>
          </Link>

          <a href="https://designer.innovativealuminum.com" target="_blank" rel="noopener noreferrer" className="group block p-7 bg-ink text-cream hover:bg-gold hover:text-ink transition-colors duration-200">
            <div className="flex items-start justify-between mb-4">
              <p className="eyebrow text-gold group-hover:text-ink">Visualize</p>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gold group-hover:text-ink">
                <path d="M11 3H17V9M9 11L17 3M9 17H3V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="font-heading text-2xl font-bold mb-2">Designer</h3>
            <p className="font-body text-sm opacity-80">3D project visualizer ↗</p>
          </a>
        </div>
      </div>

      {/* ACCOUNT — full gold swap on hover (reverted per user preference) */}
      <div className="mb-16">
        <p className="eyebrow text-stone-400 mb-5">Your Account</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dealers/training" className="group block p-6 bg-cream-dark hover:bg-gold transition-colors duration-200">
            <div className="flex items-start justify-between mb-3">
              <p className="eyebrow text-gold group-hover:text-ink">Program</p>
              {isAuthorized && (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="10" fill="#B69A5A" className="group-hover:fill-ink" />
                  <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <h3 className="font-heading text-xl font-bold mb-2">Training</h3>
            <p className="font-body text-sm text-stone-600 group-hover:text-ink/80">
              {completedCount} of {TRAINING_TOTAL} modules complete
            </p>
          </Link>

          <Link href="/dealers/leads" className="group block p-6 bg-cream-dark hover:bg-gold transition-colors duration-200">
            <p className="eyebrow text-gold group-hover:text-ink mb-3">Pipeline</p>
            <h3 className="font-heading text-xl font-bold mb-2">Leads</h3>
            <p className="font-body text-sm text-stone-600 group-hover:text-ink/80">Customer leads from IAS.</p>
          </Link>

          <Link href="/dealers/resources" className="group block p-6 bg-cream-dark hover:bg-gold transition-colors duration-200">
            <p className="eyebrow text-gold group-hover:text-ink mb-3">Library</p>
            <h3 className="font-heading text-xl font-bold mb-2">Dealer Resources</h3>
            <p className="font-body text-sm text-stone-600 group-hover:text-ink/80">Installation guides and documents.</p>
          </Link>
        </div>
      </div>

      {/* Analytics */}
      <div className="border-t border-stone-200 pt-16">
        <p className="eyebrow text-stone-400 mb-8">Your Activity</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white border border-stone-200 hover:border-stone-400 transition-colors p-8">
            <h3 className="font-heading text-xl font-bold mb-4">Training Progress</h3>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-5xl font-heading font-bold tabular-nums">{trainingAnimated}</span>
              <span className="text-stone-400 mb-2">of {TRAINING_TOTAL} modules</span>
            </div>
            <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-gold transition-all duration-1000 ease-out" style={{ width: animationsReady ? `${trainingPercent}%` : "0%" }}></div>
            </div>
            <Link href="/dealers/training" className="text-sm font-body font-semibold text-gold hover:text-gold-hover uppercase tracking-wider">
              {isAuthorized ? "Review Training →" : "Continue Training →"}
            </Link>
          </div>

          <div className="bg-white border border-stone-200 hover:border-stone-400 transition-colors p-8">
            <h3 className="font-heading text-xl font-bold mb-4">Leads</h3>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-5xl font-heading font-bold tabular-nums">{leadsAnimated}</span>
              <span className="text-stone-400 mb-2">this month</span>
            </div>
            <div className="text-sm font-body text-stone-600 mb-4">Leads sent to you from IAS.</div>
            <Link href="/dealers/leads" className="text-sm font-body font-semibold text-gold hover:text-gold-hover uppercase tracking-wider">
              View Leads →
            </Link>
          </div>

          <div className="bg-white border border-stone-200 hover:border-stone-400 transition-colors p-8">
            <h3 className="font-heading text-xl font-bold mb-4">Recent Quotes</h3>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-5xl font-heading font-bold tabular-nums">{quotesAnimated}</span>
              <span className="text-stone-400 mb-2">last 30 days</span>
            </div>
            <div className="text-sm font-body text-stone-600 mb-4">
              Total value: <span className="font-semibold text-ink tabular-nums">${quoteValueAnimated.toLocaleString()}</span>
            </div>
            <Link href="/dealers/tools/calculator" className="text-sm font-body font-semibold text-gold hover:text-gold-hover uppercase tracking-wider">
              New Quote →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="font-heading text-xl font-bold mb-6">Recent Leads</h3>
            <div className="space-y-4">
              {[
                { customer: "Jim Smith", project: "Backyard deck — 80 LF", date: "Apr 22", status: "New" },
                { customer: "Sarah Liu", project: "Front porch — 32 LF", date: "Apr 20", status: "Contacted" },
                { customer: "Mike Chen", project: "Pool surround — 120 LF", date: "Apr 18", status: "Quoted" },
              ].map((lead) => (
                <div key={lead.customer} className="flex justify-between items-center pb-4 border-b border-stone-200">
                  <div>
                    <p className="font-body font-semibold">{lead.customer}</p>
                    <p className="text-sm text-stone-600">{lead.project}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wider text-gold font-semibold">{lead.status}</p>
                    <p className="text-xs text-stone-400">{lead.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-heading text-xl font-bold mb-6">News &amp; Announcements</h3>
            <div className="space-y-4">
              <div className="pb-4 border-b border-stone-200">
                <p className="text-xs uppercase tracking-wider text-gold font-semibold mb-1">New Product</p>
                <p className="font-body font-semibold mb-1">Infinity Topless 2026 pricing now live</p>
                <p className="text-sm text-stone-600">Updated US/Canada pricing reflects tariff adjustments. Calculator updated.</p>
              </div>
              <div className="pb-4 border-b border-stone-200">
                <p className="text-xs uppercase tracking-wider text-gold font-semibold mb-1">Training</p>
                <p className="font-body font-semibold mb-1">New installation video — Fascia mount</p>
                <p className="text-sm text-stone-600">Watch the latest training to maintain authorized status.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
