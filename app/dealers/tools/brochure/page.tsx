"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Dealer = { name: string; email: string };

export default function BrochurePage() {
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
    <div className="bg-cream min-h-screen">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-cream border-b border-stone-200">
        <div className="section-container py-5">
          <div className="flex items-center gap-4">
            <Link href="/dealers/dashboard" className="text-sm font-body text-stone-600 hover:text-ink transition-colors">← Dashboard</Link>
            <span className="text-stone-300">/</span>
            <p className="eyebrow text-stone-600">Tools / Brochure</p>
          </div>
        </div>
      </div>

      <div className="section-container section-padding">
        <div className="max-w-2xl">
          <p className="eyebrow text-gold mb-3">Marketing Tool</p>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">Interactive Brochure</h1>
          <p className="font-body text-lg text-stone-600 mb-12">
            A visual product walkthrough for sharing with prospective customers.
          </p>

          <div className="bg-cream-dark border border-stone-200 p-12 text-center">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto mb-6 text-gold">
              <rect x="8" y="6" width="32" height="36" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M14 14H34M14 22H34M14 30H26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="eyebrow text-stone-500 mb-3">Coming Soon</p>
            <h2 className="font-heading text-2xl font-bold mb-3">Brochure embed pending</h2>
            <p className="font-body text-stone-600 max-w-md mx-auto">
              The interactive brochure tool is being prepared for integration. Check back shortly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
