"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Module = {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoId: string;
  type: "video" | "documents";
  documents?: { name: string; description: string; url: string }[];
};

const MODULES: Module[] = [
  {
    id: "welcome",
    title: "Welcome to Innovative",
    description: "An introduction to IAS, our products, and what it means to be an authorized dealer.",
    duration: "3 min",
    videoId: "dQw4w9WgXcQ",
    type: "video",
  },
  {
    id: "products",
    title: "Product Family Overview",
    description: "Walk through our four product lines: Infinity Topless, Glass Component, Picket, and Custom railings.",
    duration: "6 min",
    videoId: "dQw4w9WgXcQ",
    type: "video",
  },
  {
    id: "fascia-install",
    title: "Fascia Mount Installation",
    description: "Step-by-step installation of the Infinity fascia mount system. Required for all installation dealers.",
    duration: "12 min",
    videoId: "dQw4w9WgXcQ",
    type: "video",
  },
  {
    id: "surface-install",
    title: "Surface Mount Installation",
    description: "Installation guide for the Infinity surface mount configuration. Covers post placement, glass setting, and finishing.",
    duration: "10 min",
    videoId: "dQw4w9WgXcQ",
    type: "video",
  },
  {
    id: "dealer-setup",
    title: "Complete Your Dealer Setup",
    description: "Submit the required forms to finalize your authorized dealer status with IAS.",
    duration: "10 min",
    videoId: "",
    type: "documents",
    documents: [
      {
        name: "New Customer Form",
        description: "Tell us about your business so we can set up your account properly.",
        url: "#",
      },
      {
        name: "Credit Application",
        description: "Optional. Apply for net-30 terms with IAS.",
        url: "#",
      },
      {
        name: "Fascia Installation Guide (PDF)",
        description: "Reference manual for the fascia mount system. Keep this on hand.",
        url: "#",
      },
    ],
  },
];

type Dealer = { name: string; email: string };

export default function TrainingPage() {
  const router = useRouter();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string>(MODULES[0].id);
  const [loading, setLoading] = useState(true);
  const [justCompleted, setJustCompleted] = useState<string | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("ias_dealer") : null;
    if (!stored) {
      router.push("/dealers/login");
      return;
    }
    try {
      setDealer(JSON.parse(stored));
    } catch {
      router.push("/dealers/login");
      return;
    }

    const storedProgress = localStorage.getItem("ias_training_progress");
    if (storedProgress) {
      try {
        const parsed = JSON.parse(storedProgress);
        setCompleted(parsed);
        const firstIncomplete = MODULES.find((m) => !parsed.includes(m.id));
        if (firstIncomplete) setActiveId(firstIncomplete.id);
      } catch {}
    }
    setLoading(false);
  }, [router]);

  function markComplete(id: string) {
    if (completed.includes(id)) return;
    const newCompleted = [...completed, id];
    setCompleted(newCompleted);
    localStorage.setItem("ias_training_progress", JSON.stringify(newCompleted));
    setJustCompleted(id);

    setTimeout(() => {
      setJustCompleted(null);
      const currentIdx = MODULES.findIndex((m) => m.id === id);
      const next = MODULES[currentIdx + 1];
      if (next) {
        setActiveId(next.id);
        const el = document.getElementById("active-module");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 2000);
  }

  function resetProgress() {
    if (confirm("Reset all training progress? This is for demo purposes.")) {
      setCompleted([]);
      localStorage.removeItem("ias_training_progress");
      setActiveId(MODULES[0].id);
    }
  }

  if (loading || !dealer) {
    return (
      <div className="section-container section-padding">
        <p className="text-stone-600">Loading...</p>
      </div>
    );
  }

  const activeModule = MODULES.find((m) => m.id === activeId) || MODULES[0];
  const completedCount = completed.length;
  const totalCount = MODULES.length;
  const progressPercent = (completedCount / totalCount) * 100;
  const isAuthorized = completedCount === totalCount;

  return (
    <div className="bg-cream">
      {/* Confetti overlay when module completed */}
      {justCompleted && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="bg-gold text-ink px-12 py-8 shadow-2xl animate-pulse">
            <p className="eyebrow mb-2">Module Complete</p>
            <p className="font-heading text-3xl font-bold">Great work, {dealer.name.split(" ")[0]}.</p>
          </div>
        </div>
      )}

      {/* Sticky progress header */}
      <div className="sticky top-0 z-30 bg-cream border-b border-stone-200">
        <div className="section-container py-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <Link href="/dealers/dashboard" className="text-sm font-body text-stone-600 hover:text-ink transition-colors">
                ← Dashboard
              </Link>
              <span className="text-stone-300">/</span>
              <p className="eyebrow text-stone-600">Training</p>
            </div>
            <div className="flex items-center gap-6">
              <p className="text-sm font-body">
                <span className="font-bold text-ink">{completedCount}</span>
                <span className="text-stone-400"> / {totalCount} complete</span>
              </p>
              {isAuthorized && (
                <span className="inline-flex items-center gap-2 bg-ink text-cream px-4 py-1.5 text-xs font-body font-bold uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-gold"></span>
                  Authorized
                </span>
              )}
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-stone-200 h-1 overflow-hidden">
            <div
              className="h-full bg-gold transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="section-container pt-16 pb-12">
        <p className="eyebrow text-gold mb-4">Authorized Dealer Program</p>
        <h1 className="text-5xl md:text-6xl font-heading font-bold mb-4 max-w-3xl">
          {isAuthorized ? "You're authorized." : "Become an authorized dealer."}
        </h1>
        <p className="font-body text-lg text-stone-600 max-w-2xl">
          {isAuthorized
            ? "All training modules complete. You now have full access to the IAS dealer network."
            : "Complete all five modules to unlock your authorized dealer status, premium pricing, and lead distribution."}
        </p>
      </div>

      {/* Module stepper */}
      <div className="section-container mb-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {MODULES.map((mod, idx) => {
            const isComplete = completed.includes(mod.id);
            const isActive = mod.id === activeId;
            return (
              <button
                key={mod.id}
                onClick={() => setActiveId(mod.id)}
                className={`text-left p-5 border transition-all ${
                  isActive
                    ? "border-gold bg-white"
                    : isComplete
                    ? "border-stone-300 bg-cream-dark"
                    : "border-stone-200 bg-white hover:border-stone-400"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`font-heading text-2xl font-bold ${isActive ? "text-gold" : isComplete ? "text-stone-400" : "text-stone-300"}`}>
                    0{idx + 1}
                  </span>
                  {isComplete && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="10" fill="#B69A5A" />
                      <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <p className={`font-body text-sm font-semibold mb-1 ${isComplete ? "text-stone-500" : "text-ink"}`}>
                  {mod.title}
                </p>
                <p className="text-xs text-stone-400">{mod.duration}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active module */}
      <div id="active-module" className="section-container pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Module content (video or documents) */}
          <div className="lg:col-span-2">
            <p className="eyebrow text-gold mb-3">Module {MODULES.findIndex((m) => m.id === activeModule.id) + 1} of {totalCount}</p>
            <h2 className="font-heading text-4xl font-bold mb-4">{activeModule.title}</h2>
            <p className="font-body text-stone-600 mb-8">{activeModule.description}</p>

            {activeModule.type === "video" && (
              <div className="aspect-video bg-ink mb-8 overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${activeModule.videoId}`}
                  title={activeModule.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}

            {activeModule.type === "documents" && activeModule.documents && (
              <div className="space-y-4 mb-8">
                {activeModule.documents.map((doc) => (
                  <div key={doc.name} className="bg-white border border-stone-200 p-6 flex items-center justify-between gap-6">
                    <div>
                      <h3 className="font-heading text-lg font-bold mb-1">{doc.name}</h3>
                      <p className="font-body text-sm text-stone-600">{doc.description}</p>
                    </div>
                    <a href={doc.url} className="btn-outline-dark whitespace-nowrap">
                      Download
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* Mark complete button */}
            {completed.includes(activeModule.id) ? (
              <div className="flex items-center gap-3 text-stone-600">
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="10" fill="#B69A5A" />
                  <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-body font-semibold">Module complete</span>
              </div>
            ) : (
              <button
                onClick={() => markComplete(activeModule.id)}
                className="btn-gold"
              >
                Mark as Complete
              </button>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-ink text-cream p-8 sticky top-32">
              <p className="eyebrow text-gold mb-4">Your Status</p>
              <p className="font-heading text-3xl font-bold mb-6">
                {isAuthorized ? "Authorized Dealer" : "In Training"}
              </p>
              <div className="space-y-3 mb-8">
                {MODULES.map((mod) => {
                  const isComplete = completed.includes(mod.id);
                  return (
                    <div key={mod.id} className="flex items-center gap-3 text-sm font-body">
                      {isComplete ? (
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
                          <circle cx="10" cy="10" r="10" fill="#B69A5A" />
                          <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-stone-400 flex-shrink-0"></div>
                      )}
                      <span className={isComplete ? "line-through text-stone-400" : ""}>{mod.title}</span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-stone-700 pt-6">
                <button
                  onClick={resetProgress}
                  className="text-xs font-body uppercase tracking-wider text-stone-400 hover:text-gold transition-colors"
                >
                  Reset Progress (Demo)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
