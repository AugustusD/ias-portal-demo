"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type DealerDocument = {
  name: string;
  description: string;
  required: boolean;
};

type Module = {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoId?: string;
  type: "video" | "documents";
  documents?: DealerDocument[];
};

const MODULES: Module[] = [
  {
    id: "welcome",
    title: "Welcome to Innovative",
    description: "An introduction to IAS, our products, and what it means to be an authorized dealer.",
    duration: "3 min",
    videoId: "8rBR4K4E9TA",
    type: "video",
  },
  {
    id: "dealer-setup",
    title: "Complete Your Dealer Setup",
    description: "Submit the required forms to finalize your authorized dealer status with IAS.",
    duration: "10 min",
    type: "documents",
    documents: [
      {
        name: "New Customer Form",
        description: "Tell us about your business so we can set up your account properly.",
        required: true,
      },
      {
        name: "Credit Application",
        description: "Optional. Apply for net-30 terms with IAS.",
        required: false,
      },
    ],
  },
  {
    id: "products",
    title: "Product Family Overview",
    description: "Walk through our four product lines: Infinity Topless, Glass Component, Picket, and Custom railings.",
    duration: "6 min",
    videoId: "8rBR4K4E9TA",
    type: "video",
  },
  {
    id: "fascia-install",
    title: "Fascia Mount Installation",
    description: "Step-by-step installation of the Infinity fascia mount system. Required for all installation dealers.",
    duration: "12 min",
    videoId: "8rBR4K4E9TA",
    type: "video",
  },
  {
    id: "surface-install",
    title: "Surface Mount Installation",
    description: "Installation guide for the Infinity surface mount configuration. Covers post placement, glass setting, and finishing.",
    duration: "10 min",
    videoId: "8rBR4K4E9TA",
    type: "video",
  },
];

type Dealer = { name: string; email: string };

// Slide-to-complete component
function SlideToComplete({ onComplete, label = "Slide to Complete" }: { onComplete: () => void; label?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [completed, setCompleted] = useState(false);

  function handleStart() {
    if (completed) return;
    setIsDragging(true);
  }

  function handleMove(clientX: number) {
    if (!isDragging || completed || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const knobWidth = 56;
    const maxPosition = rect.width - knobWidth;
    const newPosition = Math.max(0, Math.min(maxPosition, clientX - rect.left - knobWidth / 2));
    setPosition(newPosition);

    // Check if slid >90%
    if (newPosition >= maxPosition * 0.92) {
      setCompleted(true);
      setPosition(maxPosition);
      setIsDragging(false);
      setTimeout(() => onComplete(), 400);
    }
  }

  function handleEnd() {
    if (completed) return;
    setIsDragging(false);
    setPosition(0);
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      handleMove(e.clientX);
    }
    function onTouchMove(e: TouchEvent) {
      if (e.touches[0]) handleMove(e.touches[0].clientX);
    }
    function onUp() {
      handleEnd();
    }

    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("touchmove", onTouchMove);
      window.addEventListener("mouseup", onUp);
      window.addEventListener("touchend", onUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  const progressPercent = containerRef.current
    ? (position / (containerRef.current.getBoundingClientRect().width - 56)) * 100
    : 0;

  return (
    <div
      ref={containerRef}
      className="relative h-14 bg-stone-100 border border-stone-300 select-none overflow-hidden"
      style={{ touchAction: "none" }}
    >
      {/* Filled progress track */}
      <div
        className="absolute inset-y-0 left-0 bg-gold transition-all"
        style={{
          width: `${position + 56}px`,
          transitionDuration: isDragging ? "0ms" : "300ms",
        }}
      ></div>

      {/* Label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className={`font-body font-bold text-sm uppercase tracking-widest transition-opacity ${
            completed ? "text-ink" : progressPercent > 30 ? "text-ink opacity-50" : "text-stone-500"
          }`}
        >
          {completed ? "✓ Completed" : label}
        </span>
      </div>

      {/* Draggable knob */}
      <div
        className={`absolute top-1 bottom-1 w-14 bg-ink flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform ${
          isDragging ? "" : "transition-all duration-300"
        }`}
        style={{
          left: `${position + 4}px`,
          transitionDuration: isDragging ? "0ms" : "300ms",
        }}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          {completed ? (
            <path d="M5 10L9 14L15 6" stroke="#B69A5A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <>
              <path d="M8 6L13 10L8 14" stroke="#B69A5A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 6L10 10L5 14" stroke="#B69A5A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

// Document upload card
function DocumentUploadCard({ doc, onUploaded }: { doc: DealerDocument; onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  function handleUpload() {
    if (!file) return;
    setUploading(true);
    // Simulated upload — in production this would POST to an API route that emails Mike
    setTimeout(() => {
      setUploading(false);
      setUploaded(true);
      onUploaded();
    }, 1500);
  }

  return (
    <div className="bg-white border border-stone-200 p-6">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-heading text-lg font-bold">{doc.name}</h3>
            {doc.required && (
              <span className="text-xs uppercase tracking-wider bg-gold text-ink px-2 py-0.5 font-bold">Required</span>
            )}
          </div>
          <p className="font-body text-sm text-stone-600">{doc.description}</p>
        </div>
      </div>

      {!uploaded && (
        <div className="space-y-3">
          <label className="block">
            <span className="sr-only">Choose file</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              disabled={uploading}
              className="block w-full text-sm font-body text-stone-600 file:mr-4 file:py-2 file:px-4 file:border file:border-stone-300 file:bg-cream file:text-ink file:font-body file:font-semibold file:text-xs file:uppercase file:tracking-wider hover:file:bg-cream-dark file:cursor-pointer cursor-pointer"
            />
          </label>
          {file && (
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-stone-200">
              <p className="text-sm font-body text-stone-600 truncate">
                Selected: <span className="text-ink font-semibold">{file.name}</span>
              </p>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="btn-gold whitespace-nowrap text-xs px-6"
              >
                {uploading ? "Sending..." : "Submit"}
              </button>
            </div>
          )}
        </div>
      )}

      {uploaded && (
        <div className="bg-cream-dark p-4 border-l-2 border-gold">
          <div className="flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 mt-0.5">
              <circle cx="10" cy="10" r="10" fill="#B69A5A" />
              <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <p className="font-body font-semibold text-sm mb-1">Submitted to IAS</p>
              <p className="font-body text-xs text-stone-600">Mike has been notified. We'll be in touch within 1 business day.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrainingPage() {
  const router = useRouter();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string>(MODULES[0].id);
  const [loading, setLoading] = useState(true);
  const [justCompleted, setJustCompleted] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("ias_dealer") : null;
    if (!stored) {
      router.push("/dealers/login");
      return;
    }
    let parsedDealer: Dealer;
    try {
      parsedDealer = JSON.parse(stored);
      setDealer(parsedDealer);
    } catch {
      router.push("/dealers/login");
      return;
    }

    // Per-dealer training progress key (so each dealer's progress is isolated)
    const progressKey = `ias_training_progress_${parsedDealer.email}`;
    const storedProgress = localStorage.getItem(progressKey);
    if (storedProgress) {
      try {
        const parsed = JSON.parse(storedProgress);
        setCompleted(parsed);
        const firstIncomplete = MODULES.find((m) => !parsed.includes(m.id));
        if (firstIncomplete) setActiveId(firstIncomplete.id);
      } catch {}
    }

    // Per-dealer uploaded docs
    const docsKey = `ias_uploaded_docs_${parsedDealer.email}`;
    const storedDocs = localStorage.getItem(docsKey);
    if (storedDocs) {
      try {
        setUploadedDocs(new Set(JSON.parse(storedDocs)));
      } catch {}
    }

    setLoading(false);
  }, [router]);

  function markComplete(id: string) {
    if (!dealer || completed.includes(id)) return;
    const newCompleted = [...completed, id];
    setCompleted(newCompleted);
    const progressKey = `ias_training_progress_${dealer.email}`;
    localStorage.setItem(progressKey, JSON.stringify(newCompleted));
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

  function handleDocUploaded(docName: string) {
    if (!dealer) return;
    const newSet = new Set(uploadedDocs);
    newSet.add(docName);
    setUploadedDocs(newSet);
    const docsKey = `ias_uploaded_docs_${dealer.email}`;
    localStorage.setItem(docsKey, JSON.stringify(Array.from(newSet)));
  }

  function resetProgress() {
    if (!dealer) return;
    if (confirm("Reset all training progress? This is for demo purposes.")) {
      setCompleted([]);
      setUploadedDocs(new Set());
      localStorage.removeItem(`ias_training_progress_${dealer.email}`);
      localStorage.removeItem(`ias_uploaded_docs_${dealer.email}`);
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

  // For documents module: check if all required docs uploaded
  const activeRequiredDocs = activeModule.documents?.filter((d) => d.required) || [];
  const allRequiredUploaded =
    activeModule.type === "documents"
      ? activeRequiredDocs.every((d) => uploadedDocs.has(d.name))
      : true;

  return (
    <div className="bg-cream">
      {/* Confetti overlay */}
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
          <div className="lg:col-span-2">
            <p className="eyebrow text-gold mb-3">Module {MODULES.findIndex((m) => m.id === activeModule.id) + 1} of {totalCount}</p>
            <h2 className="font-heading text-4xl font-bold mb-4">{activeModule.title}</h2>
            <p className="font-body text-stone-600 mb-8">{activeModule.description}</p>

            {activeModule.type === "video" && activeModule.videoId && (
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
                  <DocumentUploadCard
                    key={doc.name}
                    doc={doc}
                    onUploaded={() => handleDocUploaded(doc.name)}
                  />
                ))}
                {!allRequiredUploaded && (
                  <p className="text-sm font-body text-stone-500 italic pt-2">
                    Upload all required documents above before completing this module.
                  </p>
                )}
              </div>
            )}

            {/* Slide to complete */}
            <div className="max-w-md">
              {completed.includes(activeModule.id) ? (
                <div className="flex items-center gap-3 text-stone-600">
                  <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="10" fill="#B69A5A" />
                    <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="font-body font-semibold">Module complete</span>
                </div>
              ) : allRequiredUploaded ? (
                <SlideToComplete onComplete={() => markComplete(activeModule.id)} />
              ) : (
                <div className="bg-stone-100 border border-stone-300 h-14 flex items-center justify-center">
                  <span className="font-body text-sm text-stone-400 uppercase tracking-widest">Upload documents to unlock</span>
                </div>
              )}
            </div>
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
