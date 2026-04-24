"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type DealerDocument = {
  name: string;
  description: string;
  required: boolean;
  templateUrl: string;
  instructions: string;
};

type ReferenceDoc = {
  name: string;
  description: string;
  url: string;
};

type Module = {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoId?: string;
  type: "video" | "documents";
  documents?: DealerDocument[];
  references?: ReferenceDoc[];
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
        templateUrl: "/documents/new-customer-form.pdf",
        instructions: "Download the form, fill it out using Adobe Acrobat (free) or print and complete by hand, then upload the signed file back here.",
      },
      {
        name: "Credit Application",
        description: "Optional. Apply for net-30 terms with IAS.",
        required: false,
        templateUrl: "/documents/credit-application.pdf",
        instructions: "Only complete this if you want to apply for credit terms. Bank information is encrypted in transit and only shared with our credit team.",
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
    references: [
      {
        name: "Infinity Fascia Installation Guide",
        description: "Detailed reference manual for fascia mount installations. Keep this on hand.",
        url: "/documents/InfinityInstallationGuideFascia.pdf",
      },
      {
        name: "Infinity Surface Installation Guide",
        description: "Companion guide for surface mount installations.",
        url: "/documents/InfinityInstallationGuideSurface.pdf",
      },
      {
        name: "Glass Installation Reference",
        description: "Glass measurement, ordering, and installation specifics.",
        url: "/documents/installation_glass.pdf",
      },
    ],
  },
  {
    id: "surface-install",
    title: "Surface Mount Installation",
    description: "Installation guide for the Infinity surface mount configuration. Covers post placement, glass setting, and finishing.",
    duration: "10 min",
    videoId: "8rBR4K4E9TA",
    type: "video",
    references: [
      {
        name: "Infinity Surface Installation Guide",
        description: "Detailed reference manual for surface mount installations.",
        url: "/documents/InfinityInstallationGuideSurface.pdf",
      },
      {
        name: "Wall Track Installation Guide",
        description: "Complete reference for wall track applications.",
        url: "/documents/InstallationGuideWallTrackComplete.pdf",
      },
      {
        name: "Picket Installation Reference",
        description: "Picket railing installation specifics for mixed installs.",
        url: "/documents/installation_picket.pdf",
      },
      {
        name: "Stairs Installation Reference",
        description: "Stair railing installation guide for sloped applications.",
        url: "/documents/installation_stairs.pdf",
      },
      {
        name: "Flex Rail Installation Guide",
        description: "Flex rail installation reference.",
        url: "/documents/Installation_Guide-Flex_Rail.pdf",
      },
    ],
  },
];

type Dealer = { name: string; email: string };

// SLIDE TO COMPLETE
function SlideToComplete({ onComplete, label = "Slide to Complete" }: { onComplete: () => void; label?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [completed, setCompleted] = useState(false);

  function handleStart() { if (completed) return; setIsDragging(true); }

  function handleMove(clientX: number) {
    if (!isDragging || completed || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const knobWidth = 56;
    const maxPosition = rect.width - knobWidth;
    const newPosition = Math.max(0, Math.min(maxPosition, clientX - rect.left - knobWidth / 2));
    setPosition(newPosition);
    if (newPosition >= maxPosition * 0.92) {
      setCompleted(true);
      setPosition(maxPosition);
      setIsDragging(false);
      setTimeout(() => onComplete(), 400);
    }
  }

  function handleEnd() { if (completed) return; setIsDragging(false); setPosition(0); }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) { handleMove(e.clientX); }
    function onTouchMove(e: TouchEvent) { if (e.touches[0]) handleMove(e.touches[0].clientX); }
    function onUp() { handleEnd(); }
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

  return (
    <div ref={containerRef} className="relative h-14 bg-stone-100 border border-stone-300 select-none overflow-hidden" style={{ touchAction: "none" }}>
      <div className="absolute inset-y-0 left-0 bg-gold transition-all" style={{ width: `${position + 56}px`, transitionDuration: isDragging ? "0ms" : "300ms" }}></div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className={`font-body font-bold text-sm uppercase tracking-widest transition-opacity ${completed ? "text-ink" : "text-stone-500"}`}>
          {completed ? "✓ Completed" : label}
        </span>
      </div>
      <div
        className={`absolute top-1 bottom-1 w-14 bg-ink flex items-center justify-center cursor-grab active:cursor-grabbing ${isDragging ? "" : "transition-all duration-300"}`}
        style={{ left: `${position + 4}px` }}
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

// DOCUMENT UPLOAD CARD with Download + View
function DocumentUploadCard({ doc, onUploaded }: { doc: DealerDocument; onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  function handleUpload() {
    if (!file) return;
    setUploading(true);
    setTimeout(() => { setUploading(false); setUploaded(true); onUploaded(); }, 1500);
  }

  return (
    <div className="bg-white border border-stone-200">
      <div className="p-6 border-b border-stone-200">
        <div className="flex items-start justify-between gap-4 mb-2">
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
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="text-xs font-body uppercase tracking-wider text-gold hover:text-gold-hover"
        >
          {showInstructions ? "− Hide" : "+ View"} Instructions
        </button>
        {showInstructions && (
          <p className="font-body text-sm text-stone-600 mt-3 leading-relaxed">{doc.instructions}</p>
        )}
      </div>

      {!uploaded ? (
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stone-200">
          {/* LEFT: Download + View template */}
          <div className="p-6 bg-cream-dark">
            <p className="eyebrow text-stone-500 mb-3">Step 1</p>
            <h4 className="font-heading text-base font-bold mb-2">Get Template</h4>
            <p className="font-body text-xs text-stone-600 mb-4">Download or view the blank form.</p>
            <div className="flex gap-2">
              <a href={doc.templateUrl} download className="btn-gold text-xs px-4 py-2 flex-1 text-center">Download</a>
              <a href={doc.templateUrl} target="_blank" rel="noopener noreferrer" className="btn-outline-dark text-xs px-4 py-2 flex-1 text-center">View</a>
            </div>
          </div>

          {/* RIGHT: Upload completed */}
          <div className="p-6">
            <p className="eyebrow text-stone-500 mb-3">Step 2</p>
            <h4 className="font-heading text-base font-bold mb-2">Upload Completed</h4>
            <p className="font-body text-xs text-stone-600 mb-4">Send your signed form to IAS.</p>

            <label className="block mb-3">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                disabled={uploading}
                className="block w-full text-xs font-body text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:border file:border-stone-300 file:bg-cream file:text-ink file:font-body file:font-semibold file:text-xs file:uppercase file:tracking-wider hover:file:bg-cream-dark file:cursor-pointer cursor-pointer"
              />
            </label>

            {file && (
              <div className="space-y-2">
                <p className="text-xs font-body text-stone-600 truncate">
                  Selected: <span className="text-ink font-semibold">{file.name}</span>
                </p>
                <button onClick={handleUpload} disabled={uploading} className="btn-gold text-xs px-6 w-full">
                  {uploading ? "Sending..." : "Submit to IAS"}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 bg-cream-dark border-t-2 border-gold">
          <div className="flex items-start gap-3">
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 mt-0.5">
              <circle cx="10" cy="10" r="10" fill="#B69A5A" />
              <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <p className="font-body font-semibold mb-1">Submitted to IAS</p>
              <p className="font-body text-sm text-stone-600">Mike has been notified. We'll be in touch within 1 business day.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// REFERENCE DOC CARD with Download + View
function ReferenceDocCard({ doc }: { doc: ReferenceDoc }) {
  return (
    <div className="block p-5 bg-white border border-stone-200 hover:border-gold transition-colors">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <p className="eyebrow text-stone-400 mb-2">PDF</p>
          <h4 className="font-heading text-base font-bold mb-1">{doc.name}</h4>
          <p className="font-body text-xs text-stone-600">{doc.description}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <a href={doc.url} download className="btn-gold text-xs px-4 py-2 flex-1 text-center">Download</a>
        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn-outline-dark text-xs px-4 py-2 flex-1 text-center">View</a>
      </div>
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
  const [lockedClickFeedback, setLockedClickFeedback] = useState<string | null>(null);

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
        setCompleted(parsed);
        const firstIncomplete = MODULES.find((m) => !parsed.includes(m.id));
        if (firstIncomplete) setActiveId(firstIncomplete.id);
      } catch {}
    }

    const docsKey = `ias_uploaded_docs_${parsedDealer.email}`;
    const storedDocs = localStorage.getItem(docsKey);
    if (storedDocs) {
      try { setUploadedDocs(new Set(JSON.parse(storedDocs))); } catch {}
    }
    setLoading(false);
  }, [router]);

  function isModuleUnlocked(moduleId: string): boolean {
    const idx = MODULES.findIndex((m) => m.id === moduleId);
    if (idx === 0) return true;
    const previousId = MODULES[idx - 1].id;
    return completed.includes(previousId);
  }

  function handleModuleClick(moduleId: string) {
    if (!isModuleUnlocked(moduleId)) {
      setLockedClickFeedback(moduleId);
      setTimeout(() => setLockedClickFeedback(null), 1500);
      return;
    }
    setActiveId(moduleId);
  }

  function markComplete(id: string) {
    if (!dealer || completed.includes(id)) return;
    const newCompleted = [...completed, id];
    setCompleted(newCompleted);
    localStorage.setItem(`ias_training_progress_${dealer.email}`, JSON.stringify(newCompleted));
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
    localStorage.setItem(`ias_uploaded_docs_${dealer.email}`, JSON.stringify(Array.from(newSet)));
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
    return <div className="section-container section-padding"><p className="text-stone-600">Loading...</p></div>;
  }

  const activeModule = MODULES.find((m) => m.id === activeId) || MODULES[0];
  const completedCount = completed.length;
  const totalCount = MODULES.length;
  const progressPercent = (completedCount / totalCount) * 100;
  const isAuthorized = completedCount === totalCount;

  const activeRequiredDocs = activeModule.documents?.filter((d) => d.required) || [];
  const allRequiredUploaded =
    activeModule.type === "documents"
      ? activeRequiredDocs.every((d) => uploadedDocs.has(d.name))
      : true;

  return (
    <div className="bg-cream">
      {justCompleted && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="bg-gold text-ink px-12 py-8 shadow-2xl animate-pulse">
            <p className="eyebrow mb-2">Module Complete</p>
            <p className="font-heading text-3xl font-bold">Great work, {dealer.name.split(" ")[0]}.</p>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-30 bg-cream border-b border-stone-200">
        <div className="section-container py-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <Link href="/dealers/dashboard" className="text-sm font-body text-stone-600 hover:text-ink transition-colors">← Dashboard</Link>
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
            <div className="h-full bg-gold transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      </div>

      <div className="section-container pt-16 pb-12">
        <p className="eyebrow text-gold mb-4">Authorized Dealer Program</p>
        <h1 className="text-5xl md:text-6xl font-heading font-bold mb-4 max-w-3xl">
          {isAuthorized ? "You're authorized." : "Become an authorized dealer."}
        </h1>
        <p className="font-body text-lg text-stone-600 max-w-2xl">
          {isAuthorized
            ? "All training modules complete. You now have full access to the IAS dealer network."
            : "Complete each module in order to unlock your authorized dealer status, premium pricing, and lead distribution."}
        </p>
      </div>

      <div className="section-container mb-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {MODULES.map((mod, idx) => {
            const isComplete = completed.includes(mod.id);
            const isActive = mod.id === activeId;
            const isUnlocked = isModuleUnlocked(mod.id);
            const isJiggling = lockedClickFeedback === mod.id;

            return (
              <button
                key={mod.id}
                onClick={() => handleModuleClick(mod.id)}
                disabled={!isUnlocked}
                className={`text-left p-5 border transition-all relative ${isJiggling ? "animate-pulse" : ""} ${
                  !isUnlocked
                    ? "border-stone-200 bg-stone-50 cursor-not-allowed opacity-60"
                    : isActive
                    ? "border-gold bg-white"
                    : isComplete
                    ? "border-stone-300 bg-cream-dark"
                    : "border-stone-200 bg-white hover:border-stone-400"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`font-heading text-2xl font-bold ${
                    !isUnlocked ? "text-stone-300" : isActive ? "text-gold" : isComplete ? "text-stone-400" : "text-stone-300"
                  }`}>
                    0{idx + 1}
                  </span>
                  {isComplete && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="10" fill="#B69A5A" />
                      <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {!isUnlocked && !isComplete && (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-stone-400">
                      <rect x="5" y="9" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M7 9V6.5C7 4.84 8.34 3.5 10 3.5C11.66 3.5 13 4.84 13 6.5V9" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  )}
                </div>
                <p className={`font-body text-sm font-semibold mb-1 ${
                  !isUnlocked ? "text-stone-400" : isComplete ? "text-stone-500" : "text-ink"
                }`}>
                  {mod.title}
                </p>
                <p className="text-xs text-stone-400">{mod.duration}</p>
                {isJiggling && (
                  <p className="absolute -bottom-7 left-0 right-0 text-xs text-center text-stone-500 font-body italic">Complete previous module first</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

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
              <div className="space-y-5 mb-8">
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

            {activeModule.references && activeModule.references.length > 0 && (
              <div className="mb-8">
                <div className="flex items-baseline justify-between mb-5">
                  <h3 className="font-heading text-xl font-bold">Reference Documents</h3>
                  <p className="text-xs font-body text-stone-500 uppercase tracking-wider">{activeModule.references.length} Files</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeModule.references.map((ref) => (
                    <ReferenceDocCard key={ref.name} doc={ref} />
                  ))}
                </div>
              </div>
            )}

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

          <div className="lg:col-span-1">
            <div className="bg-ink text-cream p-8 sticky top-32">
              <p className="eyebrow text-gold mb-4">Your Status</p>
              <p className="font-heading text-3xl font-bold mb-6">
                {isAuthorized ? "Authorized Dealer" : "In Training"}
              </p>
              <div className="space-y-3 mb-8">
                {MODULES.map((mod) => {
                  const isComplete = completed.includes(mod.id);
                  const unlocked = isModuleUnlocked(mod.id);
                  return (
                    <div key={mod.id} className="flex items-center gap-3 text-sm font-body">
                      {isComplete ? (
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
                          <circle cx="10" cy="10" r="10" fill="#B69A5A" />
                          <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : unlocked ? (
                        <div className="w-4 h-4 rounded-full border border-stone-400 flex-shrink-0"></div>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 text-stone-500">
                          <rect x="5" y="9" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M7 9V6.5C7 4.84 8.34 3.5 10 3.5C11.66 3.5 13 4.84 13 6.5V9" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      )}
                      <span className={isComplete ? "line-through text-stone-400" : !unlocked ? "text-stone-500" : ""}>
                        {mod.title}
                      </span>
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
