"use client";

import { useEffect, useState } from "react";

type ToolHelpWidgetsProps = {
  toolKey: string;
  videoId: string;
  toolName: string;
};

export function ToolHelpWidgets({ toolKey, videoId, toolName }: ToolHelpWidgetsProps) {
  const [showModal, setShowModal] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const dismissKey = `ias_help_popup_dismissed_${toolKey}`;
    const alreadyDismissed = typeof window !== "undefined" && localStorage.getItem(dismissKey) === "true";
    if (!alreadyDismissed) {
      const timer = setTimeout(() => setShowPopup(true), 3500);
      return () => clearTimeout(timer);
    }
  }, [toolKey]);

  function dismissOnce() { setShowPopup(false); }
  function dismissForever() {
    localStorage.setItem(`ias_help_popup_dismissed_${toolKey}`, "true");
    setShowPopup(false);
  }
  function openModalFromPopup() { setShowModal(true); dismissOnce(); }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-body font-semibold uppercase tracking-wider text-stone-600 hover:text-gold transition-colors whitespace-nowrap"
        title={`Watch ${toolName} video guide`}
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 6.5L13.5 10L8 13.5V6.5Z" fill="currentColor" />
        </svg>
        Video Guide
      </button>

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
                <h3 className="font-heading text-xl font-bold">{toolName}</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-stone-500 hover:text-ink text-2xl leading-none"
                aria-label="Close"
              >×</button>
            </div>
            <div className="aspect-video bg-ink">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                title={`${toolName} guide`}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

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
                If you're having trouble with {toolName}, check the Video Guide button at the top of the page for a quick walkthrough.
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
    </>
  );
}
