"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Dealer = { name: string; email: string };

const TRAINING_TOTAL = 5;

export default function DashboardPage() {
  const router = useRouter();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("ias_dealer");
    router.push("/dealers/login");
  }

  if (loading || !dealer) {
    return <div className="section-container section-padding"><p className="text-stone-600">Loading...</p></div>;
  }

  const trainingPercent = (completedCount / TRAINING_TOTAL) * 100;
  const isAuthorized = completedCount === TRAINING_TOTAL;

  return (
    <div className="section-container section-padding">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <div>
          <p className="eyebrow text-gold mb-3">Dealer Portal</p>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-2">
            Welcome back, {dealer.name}.
          </h1>
          <p className="font-body text-stone-600">
            <span className="inline-flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${isAuthorized ? "bg-green-500" : "bg-yellow-500"}`}></span>
              {isAuthorized ? "Authorized Dealer · Full access" : `Pending Authorization · ${TRAINING_TOTAL - completedCount} module${TRAINING_TOTAL - completedCount === 1 ? "" : "s"} left`}
            </span>
          </p>
        </div>
        <button onClick={handleLogout} className="btn-outline-dark">
          Log Out
        </button>
      </div>

      {/* TOOLS */}
      <div className="mb-10">
        <div className="flex items-baseline justify-between mb-5">
          <p className="eyebrow text-stone-400">Tools</p>
          <p className="text-xs font-body text-stone-400">Open and use any time</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dealers/tools/calculator"
            className="group block p-7 bg-ink text-cream border-b-2 border-ink hover:border-gold hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <p className="eyebrow text-gold">Pricing</p>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gold group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                <path d="M5 15L15 5M15 5H7M15 5V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="font-heading text-2xl font-bold mb-2">Calculator</h3>
            <p className="font-body text-sm opacity-80">Live pricing for Infinity systems.</p>
          </Link>

          <Link
            href="/dealers/tools/order-sheets"
            className="group block p-7 bg-ink text-cream border-b-2 border-ink hover:border-gold hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <p className="eyebrow text-gold">Catalog</p>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gold group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                <path d="M5 15L15 5M15 5H7M15 5V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="font-heading text-2xl font-bold mb-2">Order Sheets</h3>
            <p className="font-body text-sm opacity-80">Full product catalog and order builder.</p>
          </Link>

          <a
            href="https://designer.innovativealuminum.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group block p-7 bg-ink text-cream border-b-2 border-ink hover:border-gold hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <p className="eyebrow text-gold">Visualize</p>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gold group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                <path d="M11 3H17V9M9 11L17 3M9 17H3V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="font-heading text-2xl font-bold mb-2">Designer</h3>
            <p className="font-body text-sm opacity-80">3D project visualizer ↗</p>
          </a>
        </div>
      </div>

      {/* ACCOUNT */}
      <div className="mb-16">
        <p className="eyebrow text-stone-400 mb-5">Your Account</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dealers/training"
            className="group block p-6 bg-cream-dark border-b-2 border-stone-200 hover:border-gold hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="eyebrow text-gold">Program</p>
              {isAuthorized && (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="10" fill="#B69A5A" />
                  <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <h3 className="font-heading text-xl font-bold mb-2">Training</h3>
            <p className="font-body text-sm text-stone-600">
              {completedCount} of {TRAINING_TOTAL} modules complete
            </p>
          </Link>

          <Link
            href="/dealers/leads"
            className="group block p-6 bg-cream-dark border-b-2 border-stone-200 hover:border-gold hover:-translate-y-0.5 transition-all duration-200"
          >
            <p className="eyebrow text-gold mb-3">Pipeline</p>
            <h3 className="font-heading text-xl font-bold mb-2">Leads</h3>
            <p className="font-body text-sm text-stone-600">
              Customer leads from IAS.
            </p>
          </Link>

          <Link
            href="/dealers/resources"
            className="group block p-6 bg-cream-dark border-b-2 border-stone-200 hover:border-gold hover:-translate-y-0.5 transition-all duration-200"
          >
            <p className="eyebrow text-gold mb-3">Library</p>
            <h3 className="font-heading text-xl font-bold mb-2">Resources</h3>
            <p className="font-body text-sm text-stone-600">
              Installation guides and documents.
            </p>
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
              <span className="text-5xl font-heading font-bold">{completedCount}</span>
              <span className="text-stone-400 mb-2">of {TRAINING_TOTAL} modules</span>
            </div>
            <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-gold transition-all duration-700" style={{ width: `${trainingPercent}%` }}></div>
            </div>
            <Link href="/dealers/training" className="text-sm font-body font-semibold text-gold hover:text-gold-hover uppercase tracking-wider">
              {isAuthorized ? "Review Training →" : "Continue Training →"}
            </Link>
          </div>

          <div className="bg-white border border-stone-200 hover:border-stone-400 transition-colors p-8">
            <h3 className="font-heading text-xl font-bold mb-4">Leads</h3>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-5xl font-heading font-bold">3</span>
              <span className="text-stone-400 mb-2">this month</span>
            </div>
            <div className="text-sm font-body text-stone-600 mb-4">
              Leads sent to you from IAS.
            </div>
            <Link href="/dealers/leads" className="text-sm font-body font-semibold text-gold hover:text-gold-hover uppercase tracking-wider">
              View Leads →
            </Link>
          </div>

          <div className="bg-white border border-stone-200 hover:border-stone-400 transition-colors p-8">
            <h3 className="font-heading text-xl font-bold mb-4">Recent Quotes</h3>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-5xl font-heading font-bold">7</span>
              <span className="text-stone-400 mb-2">last 30 days</span>
            </div>
            <div className="text-sm font-body text-stone-600 mb-4">
              Total value: <span className="font-semibold text-ink">$84,250</span>
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
