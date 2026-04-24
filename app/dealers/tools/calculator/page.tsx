"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Dealer = { name: string; email: string };

export default function CalculatorPage() {
  const router = useRouter();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const TOOL_KEY = "calculator";
  const VIDEO_ID = "8rBR4K4E9TA";
  const TOOL_NAME = "Calculator";

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("ias_dealer") : null;
    if (!stored) { router.push("/dealers/login"); return; }
    try {
      setDealer(JSON.parse(stored));
    } catch { router.push("/dealers/login"); return; }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (loading) return;
    const dismissKey = `ias_help_popup_dismissed_${TOOL_KEY}`;
    const alreadyDismissed = typeof window !== "undefined" && localStorage.getItem(dismissKey) === "true";
    if (!alreadyDismissed) {
      const timer = setTimeout(() => setShowPopup(true), 3500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  function dismissOnce() { setShowPopup(false); }
  function dismissForever() {
    localStorage.setItem(`ias_help_popup_dismissed_${TOOL_KEY}`, "true");
    setShowPopup(false);
  }
  function openModalFromPopup() { setShowModal(true); dismissOnce(); }

  if (loading || !dealer) {
    return <div className="section-container section-padding"><p className="text-stone-600">Loading...</p></div>;
  }

  return (
    <div className="bg-cream">
      <div className="sticky top-0 z-30 bg-cream border-b border-stone-200">
        <div className="section-container py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dealers/dashboard" className="text-sm font-body text-stone-600 hover:text-ink transition-colors">← Dashboard</Link>
              <span className="text-stone-300">/</span>
              <p className="eyebrow text-stone-600">Tools / Calculator</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-body font-semibold uppercase tracking-wider text-stone-600 hover:text-gold transition-colors whitespace-nowrap"
                title={`Watch ${TOOL_NAME} video guide`}
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 6.5L13.5 10L8 13.5V6.5Z" fill="currentColor" />
                </svg>
                Video Guide
              </button>
              <a
                href="https://ias-calculator.vercel.app"
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
      </div>

      <div className="section-container pt-10 pb-6">
        <p className="eyebrow text-gold mb-2">Pricing Tool</p>
        <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">Infinity Calculator</h1>
        <p className="font-body text-stone-600 max-w-2xl mb-3">
          Generate live pricing for Infinity Topless railing systems. For full screen use, click Open in Full Window above.
        </p>
        <p className="text-xs font-body text-stone-500 italic">
          Preview mode — interaction is disabled in this view. Click "Open in Full Window" to use the tool.
        </p>
      </div>

      {/* Iframe wrapper with invisible click-blocker on top */}
      <div className="w-full px-4 md:px-6 lg:px-8 pb-24">
        <div className="relative border border-stone-200 bg-white overflow-hidden" style={{ height: "1400px" }}>
          <iframe
            src="https://ias-calculator.vercel.app"
            title="Infinity Calculator"
            className="w-full h-full"
            frameBorder="0"
          ></iframe>
          {/* Transparent blocker — captures all clicks/scrolls so iframe is visible but not interactive */}
          <div
            className="absolute inset-0 z-10 cursor-not-allowed"
            style={{ background: "transparent" }}
            aria-label="Interaction disabled in preview mode"
            title="Preview mode — open in full window to use this tool"
          ></div>
        </div>
      </div>

      {/* YouTube modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-ink/80 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-cream w-full max-w-4xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
              <div>
                <p className="eyebrow text-gold">Video Guide</p>
                <h3 className="font-heading text-xl font-bold">{TOOL_NAME}</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-stone-500 hover:text-ink text-2xl leading-none"
                aria-label="Close"
              >×</button>
            </div>
            <div className="aspect-video bg-ink">
              <iframe
                src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1`}
                title={`${TOOL_NAME} guide`}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* Bottom-right popup */}
      {showPopup && (
        <div className="fixed bottom-6 right-6 z-40 max-w-sm">
          <div className="bg-ink text-cream shadow-2xl border-l-4 border-gold">
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-gold flex-shrink-0" aria-hidden="true">
                    <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M10 6V10.5M10 13V13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <p className="eyebrow text-gold">Need help?</p>
                </div>
                <button
                  onClick={dismissOnce}
                  className="text-cream/60 hover:text-cream text-lg leading-none"
                  aria-label="Close"
                >×</button>
              </div>
              <p className="font-body text-sm leading-relaxed mb-4 text-cream/90">
                If you're having trouble with {TOOL_NAME}, check the Video Guide button at the top of the page for a quick walkthrough.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={openModalFromPopup}
                  className="text-xs font-body font-bold uppercase tracking-widest px-4 py-2 bg-gold text-ink hover:bg-gold-hover transition-colors"
                >Watch Guide</button>
                <button
                  onClick={dismissOnce}
                  className="text-xs font-body font-bold uppercase tracking-widest px-4 py-2 border border-cream/30 text-cream hover:border-cream transition-colors"
                >Got it</button>
              </div>
              <button
                onClick={dismissForever}
                className="text-xs font-body text-cream/50 hover:text-cream/80 transition-colors mt-3 underline underline-offset-2"
              >Don't show this again</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
