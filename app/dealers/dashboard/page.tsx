"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Dealer = {
  name: string;
  email: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for logged-in dealer
    const stored = typeof window !== "undefined" ? localStorage.getItem("ias_dealer") : null;
    if (!stored) {
      router.push("/dealers/login");
      return;
    }
    try {
      setDealer(JSON.parse(stored));
    } catch {
      router.push("/dealers/login");
    }
    setLoading(false);
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("ias_dealer");
    router.push("/dealers/login");
  }

  if (loading || !dealer) {
    return (
      <div className="section-container section-padding">
        <p className="text-stone-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="section-container section-padding">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <div>
          <p className="eyebrow text-gold mb-3">Dealer Portal</p>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-2">
            Welcome back, {dealer.name}.
          </h1>
          <p className="font-body text-stone-600">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-yellow-500"></span>
              Pending Authorization · Complete training to unlock full access
            </span>
          </p>
        </div>
        <button onClick={handleLogout} className="btn-outline-dark">
          Log Out
        </button>
      </div>

      {/* Quick action tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
        <Link
          href="/dealers/tools"
          className="group block p-8 bg-ink text-cream hover:bg-gold hover:text-ink transition-colors"
        >
          <p className="eyebrow text-gold group-hover:text-ink mb-4">01</p>
          <h2 className="text-2xl font-heading font-bold mb-2">Tools</h2>
          <p className="font-body text-sm opacity-80">
            Pricing calculator and order sheets.
          </p>
        </Link>

        <Link
          href="/dealers/training"
          className="group block p-8 bg-cream-dark hover:bg-gold transition-colors border border-stone-200"
        >
          <p className="eyebrow text-gold mb-4">02</p>
          <h2 className="text-2xl font-heading font-bold mb-2">Training</h2>
          <p className="font-body text-sm text-stone-600 group-hover:text-ink">
            Become an authorized installer.
          </p>
        </Link>

        <Link
          href="/dealers/leads"
          className="group block p-8 bg-cream-dark hover:bg-gold transition-colors border border-stone-200"
        >
          <p className="eyebrow text-gold mb-4">03</p>
          <h2 className="text-2xl font-heading font-bold mb-2">Leads</h2>
          <p className="font-body text-sm text-stone-600 group-hover:text-ink">
            Submit and track customer leads.
          </p>
        </Link>

        <a
          href="https://designer.innovativealuminum.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group block p-8 bg-cream-dark hover:bg-gold transition-colors border border-stone-200"
        >
          <p className="eyebrow text-gold mb-4">04</p>
          <h2 className="text-2xl font-heading font-bold mb-2">Designer ↗</h2>
          <p className="font-body text-sm text-stone-600 group-hover:text-ink">
            3D visualizer and project tool.
          </p>
        </a>
      </div>

      {/* Analytics section */}
      <div className="border-t border-stone-200 pt-16">
        <p className="eyebrow text-stone-400 mb-8">Your Activity</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Training progress */}
          <div className="bg-white border border-stone-200 p-8">
            <h3 className="font-heading text-xl font-bold mb-4">Training Progress</h3>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-5xl font-heading font-bold">2</span>
              <span className="text-stone-400 mb-2">of 5 modules</span>
            </div>
            <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-gold" style={{ width: "40%" }}></div>
            </div>
            <Link href="/dealers/training" className="text-sm font-body font-semibold text-gold hover:text-gold-hover uppercase tracking-wider">
              Continue Training →
            </Link>
          </div>

          {/* Submitted leads */}
          <div className="bg-white border border-stone-200 p-8">
            <h3 className="font-heading text-xl font-bold mb-4">Submitted Leads</h3>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-5xl font-heading font-bold">3</span>
              <span className="text-stone-400 mb-2">this month</span>
            </div>
            <div className="text-sm font-body text-stone-600 mb-4">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
              1 active · <span className="text-stone-400">2 pending</span>
            </div>
            <Link href="/dealers/leads" className="text-sm font-body font-semibold text-gold hover:text-gold-hover uppercase tracking-wider">
              View Leads →
            </Link>
          </div>

          {/* Recent quotes */}
          <div className="bg-white border border-stone-200 p-8">
            <h3 className="font-heading text-xl font-bold mb-4">Recent Quotes</h3>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-5xl font-heading font-bold">7</span>
              <span className="text-stone-400 mb-2">last 30 days</span>
            </div>
            <div className="text-sm font-body text-stone-600 mb-4">
              Total value: <span className="font-semibold text-ink">$84,250</span>
            </div>
            <Link href="/dealers/tools" className="text-sm font-body font-semibold text-gold hover:text-gold-hover uppercase tracking-wider">
              New Quote →
            </Link>
          </div>
        </div>

        {/* Recent activity feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent leads */}
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

          {/* Announcements */}
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
