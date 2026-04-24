"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Dealer = { name: string; email: string };

const ORDER_SHEETS_URL = "https://iaspricing-ewb5yxbe.manus.space/";

export default function OrderSheetsPage() {
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
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dealers/dashboard" className="text-sm font-body text-stone-600 hover:text-ink transition-colors">← Dashboard</Link>
              <span className="text-stone-300">/</span>
              <p className="eyebrow text-stone-600">Tools / Order Sheets</p>
            </div>
            <a
              href={ORDER_SHEETS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-gold text-ink font-body font-bold text-xs uppercase tracking-widest hover:bg-gold transition-colors whitespace-nowrap"
            >
              Open in Full Window
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <path d="M11 3H17V9M9 11L17 3M9 17H3V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Compact page header */}
      <div className="section-container pt-10 pb-6">
        <p className="eyebrow text-gold mb-2">Order Tool</p>
        <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">Dealer Order Sheets</h1>
        <p className="font-body text-stone-600 max-w-2xl">
          Browse the full 2026 product catalog, build orders, and export to Excel or email. For full screen use, click Open in Full Window above.
        </p>
      </div>

      {/* FULL-BLEED iframe */}
      <div className="w-full px-4 md:px-6 lg:px-8 pb-24">
        <div className="border border-stone-200 bg-white overflow-hidden" style={{ height: "1800px" }}>
          <iframe
            src={ORDER_SHEETS_URL}
            title="IAS Order Sheets"
            className="w-full h-full"
            frameBorder="0"
          ></iframe>
        </div>
      </div>
    </div>
  );
}
