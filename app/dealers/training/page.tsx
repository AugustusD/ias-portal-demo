"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

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
  type: "video" | "form";
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
    title: "Tell us about your business",
    description: "Submit the new customer form so IAS can finalize your dealer account.",
    duration: "5 min",
    type: "form",
  },
  {
    id: "products",
    title: "Product Family Overview",
    description: "Walk through our four product lines: Infinity Topless, Glass Component, Picket, and Custom railings.",
    duration: "6 min",
    videoId: "8rBR4K4E9TA",
    type: "video",
    references: [
      { name: "Infinity Topless Sell Sheet", description: "Product overview for our flagship topless glass system.", url: "/documents/sellsheet_infinity.pdf" },
      { name: "Glass Component Sell Sheet", description: "Product overview for component glass railings.", url: "/documents/sellsheet_glass.pdf" },
      { name: "Picket Sell Sheet", description: "Product overview for welded picket systems.", url: "/documents/sellsheet_picket.pdf" },
      { name: "Custom Railings Sell Sheet", description: "Product overview for custom aluminum railing options.", url: "/documents/sellsheet_custom.pdf" },
      { name: "Powder Coating Sell Sheet", description: "Our 5-stage AAMA 2604 powder coating process and color options.", url: "/documents/sellsheet_powdercoating.pdf" },
    ],
  },
  {
    id: "installation",
    title: "Installation Fundamentals",
    description: "Core principles across all IAS railing systems: mounting types, post spacing, engineering requirements, and code compliance.",
    duration: "15 min",
    videoId: "8rBR4K4E9TA",
    type: "video",
    references: [
      { name: "Infinity Fascia Installation Guide", description: "Fascia mount installation reference for Infinity Topless systems.", url: "/documents/InfinityInstallationGuideFascia.pdf" },
      { name: "Infinity Surface Installation Guide", description: "Surface mount installation reference for Infinity Topless systems.", url: "/documents/InfinityInstallationGuideSurface.pdf" },
      { name: "Wall Track Installation Guide", description: "Complete wall track application reference.", url: "/documents/InstallationGuideWallTrackComplete.pdf" },
      { name: "Flex Rail Installation Guide", description: "Flex rail installation reference.", url: "/documents/Installation_Guide-Flex_Rail.pdf" },
      { name: "Glass Installation Reference", description: "Glass measurement, ordering, and installation.", url: "/documents/installation_glass.pdf" },
      { name: "Picket Installation Reference", description: "Welded picket installation specifics.", url: "/documents/installation_picket.pdf" },
      { name: "Stairs Installation Reference", description: "Stair railing installation for sloped applications.", url: "/documents/installation_stairs.pdf" },
    ],
  },
  {
    id: "warranty",
    title: "Warranty, Claims & Customer Support",
    description: "Understand the 20-year structural warranty, when dealers must register warranties, and how warranty registration unlocks homeowner rewards and long-term business.",
    duration: "8 min",
    videoId: "8rBR4K4E9TA",
    type: "video",
    references: [
      { name: "Residential Warranty", description: "Full residential warranty terms — 20 year structural, 10 year finish.", url: "/documents/INNOVATIVE-ALUMINUM-RESIDENTIAL-WARRANTY.pdf" },
      { name: "Commercial Warranty", description: "Commercial warranty terms — 20 year structural, 5 year finish.", url: "/documents/INNOVATIVE-ALUMINUM-COMMERCIAL-WARRANTY.pdf" },
    ],
  },
];

const GUEST_PROGRESS_KEY = "ias_guest_onboarding_progress";
const GUEST_FORM_KEY = "ias_guest_customer_form_submitted";
const PENDING_SIGNUP_KEY = "ias_pending_signup";

// Modules with index >= GUEST_LIMIT_INDEX require login (modules 3, 4, 5 = indexes 2, 3, 4)
const GUEST_LIMIT_INDEX = 2;

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

function CustomerForm({
  initiallySubmitted,
  onSubmitted,
}: {
  initiallySubmitted: boolean;
  onSubmitted: () => void;
}) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(initiallySubmitted);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    streetAddress: "",
    city: "",
    province: "",
    postalCode: "",
    yearsInBusiness: "",
    website: "",
    notes: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setData({ ...data, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { data: token, error: rpcError } = await supabase.rpc("create_pending_dealer", {
      p_company_name: data.companyName.trim(),
      p_contact_name: data.contactName.trim(),
      p_email: data.email.trim(),
      p_phone: data.phone.trim(),
      p_street_address: data.streetAddress.trim() || null,
      p_city: data.city.trim() || null,
      p_province: data.province.trim() || null,
      p_postal_code: data.postalCode.trim() || null,
      p_years_in_business: data.yearsInBusiness ? parseInt(data.yearsInBusiness) : null,
      p_website: data.website.trim() || null,
      p_notes: data.notes.trim() || null,
    });

    if (rpcError || !token) {
      setError(rpcError?.message ?? "Couldn't submit. Please try again.");
      setSubmitting(false);
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(
        PENDING_SIGNUP_KEY,
        JSON.stringify({
          contactName: data.contactName.trim(),
          email: data.email.trim(),
        })
      );
      localStorage.setItem(GUEST_FORM_KEY, "true");
    }

    setSubmitting(false);
    setSubmitted(true);
    onSubmitted();

    router.push(`/dealers/register/${token}`);
  }

  if (submitted) {
    return (
      <div className="bg-white border border-stone-200">
        <div className="p-6 bg-cream-dark border-l-4 border-gold">
          <div className="flex items-start gap-3">
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 mt-0.5">
              <circle cx="10" cy="10" r="10" fill="#B69A5A" />
              <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <p className="font-body font-semibold mb-1">Submitted to IAS</p>
              <p className="font-body text-sm text-stone-600">
                Continue to create your dealer account to finish setup.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200">
      <div className="p-6 border-b border-stone-200">
        <h3 className="font-heading text-lg font-bold mb-1">New Customer Form</h3>
        <p className="font-body text-sm text-stone-600">
          Tell us about your business so we can set up your account properly. After submitting, you&apos;ll set your password and get a shareable link to invite your coworkers.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="eyebrow text-stone-600 block mb-1">Company / Business Name *</label>
            <input
              name="companyName"
              type="text"
              required
              value={data.companyName}
              onChange={handleChange}
              className="w-full border border-stone-300 px-3 py-2 font-body bg-white"
            />
          </div>
          <div>
            <label className="eyebrow text-stone-600 block mb-1">Contact Person *</label>
            <input
              name="contactName"
              type="text"
              required
              value={data.contactName}
              onChange={handleChange}
              className="w-full border border-stone-300 px-3 py-2 font-body bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="eyebrow text-stone-600 block mb-1">Email *</label>
            <input
              name="email"
              type="email"
              required
              value={data.email}
              onChange={handleChange}
              className="w-full border border-stone-300 px-3 py-2 font-body bg-white"
            />
          </div>
          <div>
            <label className="eyebrow text-stone-600 block mb-1">Phone *</label>
            <input
              name="phone"
              type="tel"
              required
              value={data.phone}
              onChange={handleChange}
              className="w-full border border-stone-300 px-3 py-2 font-body bg-white"
            />
          </div>
        </div>

        <div>
          <label className="eyebrow text-stone-600 block mb-1">Street Address *</label>
          <input
            name="streetAddress"
            type="text"
            required
            value={data.streetAddress}
            onChange={handleChange}
            className="w-full border border-stone-300 px-3 py-2 font-body bg-white"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="eyebrow text-stone-600 block mb-1">City *</label>
            <input
              name="city"
              type="text"
              required
              value={data.city}
              onChange={handleChange}
              className="w-full border border-stone-300 px-3 py-2 font-body bg-white"
            />
          </div>
          <div>
            <label className="eyebrow text-stone-600 block mb-1">Province *</label>
            <input
              name="province"
              type="text"
              required
              value={data.province}
              onChange={handleChange}
              className="w-full border border-stone-300 px-3 py-2 font-body bg-white"
            />
          </div>
          <div>
            <label className="eyebrow text-stone-600 block mb-1">Postal Code *</label>
            <input
              name="postalCode"
              type="text"
              required
              value={data.postalCode}
              onChange={handleChange}
              className="w-full border border-stone-300 px-3 py-2 font-body bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="eyebrow text-stone-600 block mb-1">Years in Business</label>
            <input
              name="yearsInBusiness"
              type="number"
              value={data.yearsInBusiness}
              onChange={handleChange}
              className="w-full border border-stone-300 px-3 py-2 font-body bg-white"
            />
          </div>
          <div>
            <label className="eyebrow text-stone-600 block mb-1">Website (optional)</label>
            <input
              name="website"
              type="url"
              value={data.website}
              onChange={handleChange}
              placeholder="https://"
              className="w-full border border-stone-300 px-3 py-2 font-body bg-white"
            />
          </div>
        </div>

        <div>
          <label className="eyebrow text-stone-600 block mb-1">Notes (optional)</label>
          <textarea
            name="notes"
            value={data.notes}
            onChange={handleChange}
            rows={3}
            className="w-full border border-stone-300 px-3 py-2 font-body bg-white"
          />
        </div>

        {error && <p className="text-sm text-red-600 font-body">{error}</p>}

        <div className="pt-4 border-t border-stone-200">
          <button
            type="submit"
            disabled={submitting}
            className="btn-gold w-full md:w-auto px-8"
          >
            {submitting ? "Submitting..." : "Submit and Continue →"}
          </button>
          <p className="font-body text-xs text-stone-500 mt-2">
            Next step: create your password and invite your coworkers.
          </p>
        </div>
      </form>
    </div>
  );
}

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

export default function OnboardingPage() {
  const router = useRouter();
  const [isGuest, setIsGuest] = useState(true);
  const [completed, setCompleted] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string>(MODULES[0].id);
  const [loading, setLoading] = useState(true);
  const [justCompleted, setJustCompleted] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [lockedClickFeedback, setLockedClickFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function loadProgress() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsGuest(true);
        const stored = typeof window !== "undefined" ? localStorage.getItem(GUEST_PROGRESS_KEY) : null;
        const guestCompleted = stored ? JSON.parse(stored) : [];
        setCompleted(guestCompleted);
        const formStored = typeof window !== "undefined" ? localStorage.getItem(GUEST_FORM_KEY) : null;
        setFormSubmitted(formStored === "true");
        const firstIncomplete = MODULES.find((m) => !guestCompleted.includes(m.id));
        if (firstIncomplete) setActiveId(firstIncomplete.id);
        setLoading(false);
        return;
      }

      setIsGuest(false);
      const { data: progress } = await supabase
        .from("training_progress")
        .select("module_id")
        .eq("user_id", user.id);
      const completedIds = (progress || []).map((p) => p.module_id);
      setCompleted(completedIds);
      const firstIncomplete = MODULES.find((m) => !completedIds.includes(m.id));
      if (firstIncomplete) setActiveId(firstIncomplete.id);

      const formStored = typeof window !== "undefined" ? localStorage.getItem(GUEST_FORM_KEY) : null;
      setFormSubmitted(formStored === "true");

      setLoading(false);
    }
    loadProgress();
  }, [router]);

  function isModuleUnlocked(moduleId: string): boolean {
    const idx = MODULES.findIndex((m) => m.id === moduleId);
    if (idx === 0) return true;
    // Modules 3+ require an account
    if (isGuest && idx >= GUEST_LIMIT_INDEX) return false;
    const previousId = MODULES[idx - 1].id;
    return completed.includes(previousId);
  }

  function isGuestLocked(moduleId: string): boolean {
    const idx = MODULES.findIndex((m) => m.id === moduleId);
    return isGuest && idx >= GUEST_LIMIT_INDEX;
  }

  function handleModuleClick(moduleId: string) {
    if (!isModuleUnlocked(moduleId)) {
      setLockedClickFeedback(moduleId);
      setTimeout(() => setLockedClickFeedback(null), 1800);
      return;
    }
    setActiveId(moduleId);
  }

  async function markComplete(id: string) {
    if (completed.includes(id)) return;

    if (isGuest) {
      const newCompleted = [...completed, id];
      setCompleted(newCompleted);
      localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(newCompleted));
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("training_progress")
        .insert({ user_id: user.id, module_id: id });
      if (error) {
        alert("Couldn't save your progress. Try again.");
        return;
      }
      setCompleted([...completed, id]);
    }

    setJustCompleted(id);
    setTimeout(() => {
      setJustCompleted(null);
      const currentIdx = MODULES.findIndex((m) => m.id === id);
      const next = MODULES[currentIdx + 1];
      if (next && isModuleUnlocked(next.id)) {
        setActiveId(next.id);
        const el = document.getElementById("active-module");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 2000);
  }

  function handleFormSubmitted() {
    setFormSubmitted(true);
    localStorage.setItem(GUEST_FORM_KEY, "true");
  }

  if (loading) {
    return <div className="section-container section-padding"><p className="text-stone-600">Loading...</p></div>;
  }

  const activeModule = MODULES.find((m) => m.id === activeId) || MODULES[0];
  const completedCount = completed.length;
  const totalCount = MODULES.length;
  const progressPercent = (completedCount / totalCount) * 100;
  const isAuthorized = !isGuest && completedCount === totalCount;

  const canCompleteActive =
    activeModule.type === "form"
      ? formSubmitted
      : true;

  return (
    <div className="bg-cream">
      {justCompleted && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="bg-gold text-ink px-12 py-8 shadow-2xl animate-pulse">
            <p className="eyebrow mb-2">Module Complete</p>
            <p className="font-heading text-3xl font-bold">Great work.</p>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-30 bg-cream border-b border-stone-200">
        <div className="section-container py-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <Link href="/dealers/dashboard" className="text-sm font-body text-stone-600 hover:text-ink transition-colors">← Dashboard</Link>
              <span className="text-stone-300">/</span>
              <p className="eyebrow text-stone-600">Onboarding</p>
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
              {isGuest && (
                <Link href="/dealers/login" className="text-xs font-body uppercase tracking-wider text-gold hover:text-gold-hover">Sign in →</Link>
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
            ? "All onboarding modules complete. You now have full access to the IAS dealer network."
            : isGuest
            ? "Walk through the first two modules to introduce yourself to IAS. To continue beyond module 2, you'll create an account so we can save your progress."
            : "Complete each module in order to unlock your authorized dealer status, premium pricing, and lead distribution."}
        </p>
      </div>

      <div className="section-container mb-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {MODULES.map((mod, idx) => {
            const isComplete = completed.includes(mod.id);
            const isActive = mod.id === activeId;
            const isUnlocked = isModuleUnlocked(mod.id);
            const guestLocked = isGuestLocked(mod.id);
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
                {guestLocked && !isJiggling && (
                  <p className="text-[10px] text-gold font-body font-bold uppercase tracking-widest mt-2">Account required</p>
                )}
                {isJiggling && (
                  <p className="absolute -bottom-7 left-0 right-0 text-xs text-center text-stone-500 font-body italic">
                    {guestLocked ? "Create an account to continue" : "Complete previous module first"}
                  </p>
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

            {activeModule.type === "form" && (
              <div className="mb-8">
                <CustomerForm
                  initiallySubmitted={formSubmitted}
                  onSubmitted={handleFormSubmitted}
                />
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
              ) : canCompleteActive ? (
                <SlideToComplete onComplete={() => markComplete(activeModule.id)} />
              ) : (
                <div className="bg-stone-100 border border-stone-300 h-14 flex items-center justify-center">
                  <span className="font-body text-sm text-stone-400 uppercase tracking-widest">Submit the form to unlock</span>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-ink text-cream p-8 sticky top-32">
              <p className="eyebrow text-gold mb-4">Your Status</p>
              <p className="font-heading text-3xl font-bold mb-6">
                {isAuthorized ? "Authorized Dealer" : isGuest ? "Guest" : "In Onboarding"}
              </p>
              <div className="space-y-3 mb-8">
                {MODULES.map((mod) => {
                  const isComplete = completed.includes(mod.id);
                  const unlocked = isModuleUnlocked(mod.id);
                  const guestLocked = isGuestLocked(mod.id);
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
                      {guestLocked && (
                        <span className="ml-auto text-[10px] uppercase tracking-widest text-gold font-bold">Account</span>
                      )}
                    </div>
                  );
                })}
              </div>
              {isGuest && (
                <div className="border-t border-stone-700 pt-6">
                  <p className="font-body text-sm text-cream/70 mb-3">
                    Modules 3 through 5 require an account. After you submit the customer form in module 2, you&apos;ll be able to create your login.
                  </p>
                  <Link href="/dealers/login" className="btn-gold text-xs px-5 py-2.5 inline-block">Sign In</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
