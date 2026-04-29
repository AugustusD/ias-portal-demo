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
const REGISTRATION_TOKEN_KEY = "ias_registration_token";

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

function SignaturePad({ onChange }: { onChange: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }

  function startDrawing(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#0A0908";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    setHasSigned(true);
  }

  function stopDrawing() {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && hasSigned) onChange(canvas.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
    onChange("");
  }

  return (
    <div>
      <div className="border-2 border-stone-300 bg-white">
        <canvas
          ref={canvasRef}
          width={800}
          height={180}
          className="w-full h-[180px] cursor-crosshair"
          style={{ touchAction: "none" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div className="flex justify-between mt-2">
        <p className="font-body text-xs text-stone-500 italic">
          {hasSigned ? "Signed ✓" : "Sign with your mouse or finger above"}
        </p>
        <button type="button" onClick={clear} className="text-xs uppercase tracking-wider text-stone-500 hover:text-ink font-body">
          Clear
        </button>
      </div>
    </div>
  );
}

const BUSINESS_TYPES = [
  "General Contracting",
  "Landscaping Design",
  "Concrete Repair/Restoration",
  "Deck Building",
  "Railing Manufacturing",
  "Aluminum Railing Manufacturing",
  "Railing Installation",
  "Other",
];

function CustomerForm({
  initiallySubmitted,
  onSubmitted,
}: {
  initiallySubmitted: boolean;
  onSubmitted: (token: string | null) => void;
}) {
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
    registeredBusinessNumber: "",
    contractorLicenseNumber: "",
    regionsSoldTo: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    engineerRelationship: "" as "" | "yes" | "no",
    notes: "",
    signatureName: "",
    signatureTitle: "",
  });
  const [businessTypes, setBusinessTypes] = useState<string[]>([]);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [signature, setSignature] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setData({ ...data, [e.target.name]: e.target.value });
  }

  function toggleBusinessType(type: string) {
    setBusinessTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!signature) { setError("Please sign the form before submitting."); return; }
    if (!newsletterOptIn) { setError("Please acknowledge the newsletter opt-in."); return; }
    if (!data.signatureName.trim()) { setError("Please type your name to sign."); return; }

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
      p_type_of_business: businessTypes.length > 0 ? businessTypes : null,
      p_owner_name: data.ownerName.trim() || null,
      p_owner_email: data.ownerEmail.trim() || null,
      p_owner_phone: data.ownerPhone.trim() || null,
      p_engineer_relationship: data.engineerRelationship ? data.engineerRelationship === "yes" : null,
      p_newsletter_opt_in: newsletterOptIn,
      p_signature_data: signature,
      p_signature_name: data.signatureName.trim(),
      p_signature_title: data.signatureTitle.trim() || null,
      p_registered_business_number: data.registeredBusinessNumber.trim() || null,
      p_contractor_license_number: data.contractorLicenseNumber.trim() || null,
      p_regions_sold_to: data.regionsSoldTo.trim() || null,
    });

    if (rpcError || !token) {
      setError(rpcError?.message ?? "Couldn't submit. Please try again.");
      setSubmitting(false);
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify({
        contactName: data.contactName.trim(),
        email: data.email.trim(),
      }));
      localStorage.setItem(GUEST_FORM_KEY, "true");
      localStorage.setItem(REGISTRATION_TOKEN_KEY, token);
    }

    setSubmitting(false);
    setSubmitted(true);
    onSubmitted(token);
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
              <p className="font-body text-sm text-stone-600">Slide the bar below to complete this module and create your account.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200">
      <div className="p-6 border-b border-stone-200">
        <h3 className="font-heading text-lg font-bold mb-1">New Customer Information</h3>
        <p className="font-body text-sm text-stone-600">Tell us about your business so we can set up your account properly.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Business Info */}
        <div className="space-y-4">
          <p className="eyebrow text-stone-500">Business Information</p>

          <div>
            <label className="eyebrow text-stone-600 block mb-1">Company / Legal Business Name *</label>
            <input name="companyName" type="text" required value={data.companyName} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
          </div>

          <div>
            <label className="eyebrow text-stone-600 block mb-1">Primary Contact Person *</label>
            <input name="contactName" type="text" required value={data.contactName} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="eyebrow text-stone-600 block mb-1">Email *</label>
              <input name="email" type="email" required value={data.email} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
            </div>
            <div>
              <label className="eyebrow text-stone-600 block mb-1">Phone *</label>
              <input name="phone" type="tel" required value={data.phone} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
            </div>
          </div>

          <div>
            <label className="eyebrow text-stone-600 block mb-1">Street Address *</label>
            <input name="streetAddress" type="text" required value={data.streetAddress} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="eyebrow text-stone-600 block mb-1">City *</label>
              <input name="city" type="text" required value={data.city} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
            </div>
            <div>
              <label className="eyebrow text-stone-600 block mb-1">Province / State *</label>
              <input name="province" type="text" required value={data.province} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
            </div>
            <div>
              <label className="eyebrow text-stone-600 block mb-1">Postal Code *</label>
              <input name="postalCode" type="text" required value={data.postalCode} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="eyebrow text-stone-600 block mb-1">Years in Business</label>
              <input name="yearsInBusiness" type="number" value={data.yearsInBusiness} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
            </div>
            <div>
              <label className="eyebrow text-stone-600 block mb-1">Website</label>
              <input name="website" type="url" value={data.website} onChange={handleChange} placeholder="https://" className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="eyebrow text-stone-600 block mb-1">Registered Business Number</label>
              <input name="registeredBusinessNumber" type="text" value={data.registeredBusinessNumber} onChange={handleChange} placeholder="GST/HST or equivalent" className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
            </div>
            <div>
              <label className="eyebrow text-stone-600 block mb-1">Contractor License Number</label>
              <input name="contractorLicenseNumber" type="text" value={data.contractorLicenseNumber} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
            </div>
          </div>

          <div>
            <label className="eyebrow text-stone-600 block mb-1">Geographical Regions You Sell To</label>
            <input name="regionsSoldTo" type="text" value={data.regionsSoldTo} onChange={handleChange} placeholder="e.g., Lower Mainland, Vancouver Island, Okanagan" className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
          </div>
        </div>

        {/* Type of Business */}
        <div className="space-y-2 pt-4 border-t border-stone-200">
          <p className="eyebrow text-stone-500 mb-2">Type of Business (select all that apply)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {BUSINESS_TYPES.map((type) => (
              <label key={type} className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${businessTypes.includes(type) ? "border-gold bg-gold/5" : "border-stone-200 bg-white hover:border-stone-400"}`}>
                <input type="checkbox" checked={businessTypes.includes(type)} onChange={() => toggleBusinessType(type)} className="flex-shrink-0" />
                <span className="font-body text-sm">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Owner */}
        <div className="space-y-4 pt-4 border-t border-stone-200">
          <p className="eyebrow text-stone-500">Owner Information</p>
          <div>
            <label className="eyebrow text-stone-600 block mb-1">Owner&apos;s Name</label>
            <input name="ownerName" type="text" value={data.ownerName} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="eyebrow text-stone-600 block mb-1">Owner&apos;s Email</label>
              <input name="ownerEmail" type="email" value={data.ownerEmail} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
            </div>
            <div>
              <label className="eyebrow text-stone-600 block mb-1">Owner&apos;s Cell</label>
              <input name="ownerPhone" type="tel" value={data.ownerPhone} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
            </div>
          </div>
        </div>

        {/* Engineer Relationship */}
        <div className="pt-4 border-t border-stone-200">
          <p className="eyebrow text-stone-600 mb-3">Do you have a working relationship with a qualified engineer?</p>
          <p className="font-body text-xs text-stone-500 mb-3">Required for code-compliant railing engineering specs in many provinces.</p>
          <div className="flex gap-2">
            <label className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors flex-1 ${data.engineerRelationship === "yes" ? "border-gold bg-gold/5" : "border-stone-200 bg-white hover:border-stone-400"}`}>
              <input type="radio" name="engineerRelationship" value="yes" checked={data.engineerRelationship === "yes"} onChange={handleChange} />
              <span className="font-body font-semibold text-sm">Yes</span>
            </label>
            <label className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors flex-1 ${data.engineerRelationship === "no" ? "border-gold bg-gold/5" : "border-stone-200 bg-white hover:border-stone-400"}`}>
              <input type="radio" name="engineerRelationship" value="no" checked={data.engineerRelationship === "no"} onChange={handleChange} />
              <span className="font-body font-semibold text-sm">No</span>
            </label>
          </div>
        </div>

        {/* Notes */}
        <div className="pt-4 border-t border-stone-200">
          <label className="eyebrow text-stone-600 block mb-1">Additional Notes</label>
          <textarea name="notes" value={data.notes} onChange={handleChange} rows={3} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
        </div>

        {/* Newsletter Opt-in */}
        <div className="pt-4 border-t border-stone-200 bg-cream-dark p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" required checked={newsletterOptIn} onChange={(e) => setNewsletterOptIn(e.target.checked)} className="mt-1 flex-shrink-0" />
            <p className="font-body text-sm text-ink leading-relaxed">
              <span className="font-semibold">I acknowledge *</span> that I&apos;ll be added to Innovative Aluminum Systems and OnDeck Vinyl Works newsletters for important pricing and product updates. <span className="text-stone-600 italic">Your contact will not be sold.</span>
            </p>
          </label>
        </div>

        {/* Signature */}
        <div className="pt-4 border-t border-stone-200 space-y-4">
          <p className="eyebrow text-stone-600">Authorized Signature *</p>
          <SignaturePad onChange={setSignature} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="eyebrow text-stone-600 block mb-1">Name (Please Print) *</label>
              <input name="signatureName" type="text" required value={data.signatureName} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
            </div>
            <div>
              <label className="eyebrow text-stone-600 block mb-1">Title</label>
              <input name="signatureTitle" type="text" value={data.signatureTitle} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
            </div>
          </div>

          <p className="font-body text-xs text-stone-500">Date: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
        </div>

        {error && <p className="text-sm text-red-600 font-body">{error}</p>}

        <div className="pt-4 border-t border-stone-200">
          <button type="submit" disabled={submitting} className="btn-gold w-full md:w-auto px-8">
            {submitting ? "Submitting..." : "Submit to IAS"}
          </button>
          <p className="font-body text-xs text-stone-500 mt-2">
            By submitting, you confirm the information above is accurate. Your form will be reviewed within 1 business day.
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
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);
  const [lockedClickFeedback, setLockedClickFeedback] = useState<string | null>(null);
  const [showAccountPopup, setShowAccountPopup] = useState(false);

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
        const tokenStored = typeof window !== "undefined" ? localStorage.getItem(REGISTRATION_TOKEN_KEY) : null;
        if (tokenStored) setRegistrationToken(tokenStored);
        const firstAvailable = MODULES.find((m, idx) => {
          if (guestCompleted.includes(m.id)) return false;
          if (idx === 0) return true;
          if (!guestCompleted.includes(MODULES[idx - 1].id)) return false;
          if (idx >= 2) return false;
          return true;
        });
        if (firstAvailable) setActiveId(firstAvailable.id);
        else if (guestCompleted.includes("dealer-setup")) setActiveId("dealer-setup");
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

      setFormSubmitted(true);

      setLoading(false);
    }
    loadProgress();
  }, [router]);

  function isModuleUnlocked(moduleId: string): boolean {
    const idx = MODULES.findIndex((m) => m.id === moduleId);
    if (idx === 0) return true;
    const previousId = MODULES[idx - 1].id;
    if (!completed.includes(previousId)) return false;
    if (isGuest && idx >= 2) return false;
    return true;
  }

  function handleModuleClick(moduleId: string) {
    if (!isModuleUnlocked(moduleId)) {
      setLockedClickFeedback(moduleId);
      setTimeout(() => setLockedClickFeedback(null), 1500);
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

      if (id === "dealer-setup" && isGuest && registrationToken) {
        setShowAccountPopup(true);
        return;
      }

      const currentIdx = MODULES.findIndex((m) => m.id === id);
      const next = MODULES[currentIdx + 1];
      if (next && !(isGuest && currentIdx + 1 >= 2)) {
        setActiveId(next.id);
        const el = document.getElementById("active-module");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 2000);
  }

  function handleFormSubmitted(token: string | null) {
    setFormSubmitted(true);
    if (token) setRegistrationToken(token);
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
            ? "Walk through Modules 1 and 2 to learn about IAS and submit your business info. After that you'll create your account to unlock the rest."
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
            const lockedReason =
              isGuest && idx >= 2 && completed.includes("dealer-setup")
                ? "Create your account to continue"
                : "Complete previous module first";

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
                  <p className="absolute -bottom-7 left-0 right-0 text-xs text-center text-stone-500 font-body italic">{lockedReason}</p>
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
              {isGuest && (
                <div className="border-t border-stone-700 pt-6">
                  <p className="font-body text-sm text-cream/70 mb-3 leading-relaxed">
                    Modules 3 through 5 require an account. After you submit the customer form in Module 2, you&apos;ll be able to create your login.
                  </p>
                  {formSubmitted && registrationToken && (
                    <Link
                      href={`/dealers/register/${registrationToken}`}
                      className="btn-gold text-xs px-5 py-2.5 inline-block"
                    >
                      Create my account →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAccountPopup && registrationToken && (
        <div className="fixed inset-0 z-[60] bg-ink/80 flex items-center justify-center p-4">
          <div className="bg-cream max-w-md w-full p-8 shadow-2xl">
            <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-5">
              <svg width="36" height="36" viewBox="0 0 20 20" fill="none">
                <path d="M5 10L9 14L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="eyebrow text-gold mb-2 text-center">Modules 1 &amp; 2 Complete</p>
            <h2 className="font-heading text-3xl font-bold mb-3 text-center">Time to create your account.</h2>
            <p className="font-body text-sm text-stone-600 mb-6 text-center leading-relaxed">
              You&apos;re ready to continue. Create your dealer login to unlock Modules 3, 4, and 5 and join the IAS dealer network.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href={`/dealers/register/${registrationToken}`}
                className="btn-gold text-center"
              >
                Create my account →
              </Link>
              <button
                onClick={() => setShowAccountPopup(false)}
                className="text-xs font-body uppercase tracking-wider text-stone-500 hover:text-ink transition-colors py-2"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
