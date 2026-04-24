"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Dealer = { name: string; email: string };

export default function CalculatorPage() {
  const router = useRouter();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("ias_dealer") : null;
    if (!stored) { router.push("/dealers/login"); return; }
    try {
      setDealer(JSON.parse(stored));
    } catch { router.push("/dealers/login"); return; }
    setLoading(false);
  }, [router]);

  if (loading || !dealer) {
    return <div className="section-container section-padding"><p className="text-stone-600">Loading...</p></div>;
  }

  return (
    <div className="bg-cream">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-cream border-b border-stone-200">
        <div className="section-container py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dealers/dashboard" className="text-sm font-body text-stone-600 hover:text-ink transition-colors">← Dashboard</Link>
              <span className="text-stone-300">/</span>
              <p className="eyebrow text-stone-600">Tools / Calculator</p>
            </div>
            <a
              href="https://ias-calculator.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-body uppercase tracking-wider text-gold hover:text-gold-hover"
            >
              Open in Full Window ↗
            </a>
          </div>
        </div>
      </div>

      {/* Page header */}
      <div className="section-container pt-12 pb-8">
        <p className="eyebrow text-gold mb-3">Pricing Tool</p>
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-2">Infinity Calculator</h1>
        <p className="font-body text-stone-600 max-w-2xl">
          Generate live pricing for Infinity Topless railing systems. Configure mount type, glass thickness, post heights, and dealer pricing tier.
        </p>
      </div>

      {/* Iframe embed */}
      <div className="section-container pb-24">
        <div className="border border-stone-200 bg-white overflow-hidden" style={{ height: "1400px" }}>
          <iframe
            src="https://ias-calculator.vercel.app"
            title="Infinity Calculator"
            className="w-full h-full"
            frameBorder="0"
          ></iframe>
        </div>
      </div>
    </div>
  );
}
