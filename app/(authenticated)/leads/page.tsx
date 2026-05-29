"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { humanizeError } from "@/lib/errors";

type LeadStatus = "new" | "accepted" | "bid_submitted" | "won" | "lost" | "declined";

const SYSTEM_TYPE_OPTIONS = ["Infinity Topless", "Glass Component", "Picket", "Custom"] as const;

const WON_REASON_OPTIONS = [
  "Lowest bid",
  "Reputation in market",
  "Following spec",
  "Quality of powder coating",
  "Custom capability",
  "Existing relationship",
  "Other",
] as const;

const DECLINE_REASON_OPTIONS = [
  "Out of region / too far",
  "Capacity full — can't take on right now",
  "Not our type of work",
  "Material lead time too long",
  "Customer not a fit",
  "Other",
] as const;

type LeadAttachment = { path: string; filename: string; uploaded_at: string };

type Warranty = {
  type: "residential" | "commercial";
  systemType: string;
  installationDate: string;
  ownerName: string;
  ownerAddress: string;
  buildingAddress?: string;
  nearOcean: boolean;
  workmanshipYears: number;
  photosUploaded: number;
  attestation: boolean;
  signature: string;
  registeredDate: string;
};

type Lead = {
  id: string;
  customer: string;
  customerType: "homeowner" | "builder" | null;
  city: string;
  province: string;
  email: string;
  phone: string;
  address: string;
  projectType: string;
  estimatedSize: string;
  description: string;
  receivedDate: string;
  assignedDate?: string;
  status: LeadStatus;
  // Meeting items (2026-05-04 with Mike + Fred)
  projectName?: string;
  contactCompany?: string;
  bidDueDate?: string;
  installationDate?: string;
  systemTypes?: string[];
  wonReason?: string;
  declineReason?: string;
  leadAttachments?: LeadAttachment[];
  installationPhotos?: LeadAttachment[];
  // Existing
  scopeOfWork?: string;
  linealFootage?: string;
  projectValue?: string;
  orderNumber?: string;
  lostReason?: string;
  notes?: string;
  acceptedDate?: string;
  bidDate?: string;
  closedDate?: string;
  warrantyRegistered?: boolean;
  warranty?: Warranty;
};

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string; description: string }> = {
  new: { label: "New", color: "text-ink", bg: "bg-gold", description: "New lead from IAS. Respond within 2 business days." },
  accepted: { label: "Accepted", color: "text-blue-900", bg: "bg-blue-100", description: "Lead accepted. Working on quote." },
  bid_submitted: { label: "Bid Submitted", color: "text-amber-900", bg: "bg-amber-100", description: "Quote sent to customer. Awaiting decision." },
  won: { label: "Won", color: "text-green-900", bg: "bg-green-100", description: "Project secured. Completion pending." },
  lost: { label: "Lost", color: "text-stone-700", bg: "bg-stone-200", description: "Project went to another bidder." },
  declined: { label: "Declined", color: "text-amber-800", bg: "bg-amber-50 border border-amber-300", description: "Lead passed back to IAS — wasn't a fit." },
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getDaysAgo(dateStr: string): number {
  if (!dateStr) return 0;
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function isOverdue(lead: Lead): boolean {
  if (lead.status !== "new") return false;
  return getDaysAgo(lead.receivedDate) > 2;
}

function suggestWarrantyType(lead: Lead): "residential" | "commercial" {
  if (lead.customerType === "builder") return "commercial";
  const text = (lead.projectType + " " + lead.description).toLowerCase();
  if (text.includes("multi-family") || text.includes("condo") || text.includes("townhouse") ||
      text.includes("apartment") || text.includes("commercial") || text.includes("builder")) {
    return "commercial";
  }
  return "residential";
}

function suggestSystemType(lead: Lead): string {
  const text = lead.projectType.toLowerCase();
  if (text.includes("infinity")) return "Infinity Topless Glass";
  if (text.includes("glass component") || (text.includes("glass") && !text.includes("infinity"))) return "Glass Component";
  if (text.includes("picket")) return "Picket";
  return "Custom";
}

type DbLead = {
  id: string;
  customer_type: "homeowner" | "builder" | null;
  city: string | null;
  province: string | null;
  homeowner_name: string | null;
  homeowner_email: string | null;
  homeowner_phone: string | null;
  project_address: string | null;
  product_interest: string | null;
  description: string | null;
  estimated_size: string | null;
  received_at: string;
  stage: LeadStatus;
  scope_of_work: string | null;
  lineal_footage: number | null;
  project_value: number | null;
  order_number: string | null;
  lost_reason: string | null;
  notes: string | null;
  accepted_at: string | null;
  bid_submitted_at: string | null;
  closed_at: string | null;
  warranty_registered_at: string | null;
  warranty_classification: "residential" | "commercial" | null;
  warranty_system_type: string | null;
  warranty_install_date: string | null;
  warranty_building_owner_name: string | null;
  warranty_ocean_proximity_miles: number | null;
  warranty_dealer_workmanship_years: number | null;
  warranty_signed_by_name: string | null;
  warranty_signed_at: string | null;
  warranty_photo_paths: string[] | null;
  // Meeting items
  project_name: string | null;
  contact_company: string | null;
  bid_due_date: string | null;
  installation_date: string | null;
  system_types: string[] | null;
  won_reason: string | null;
  decline_reason: string | null;
  lead_attachment_paths: LeadAttachment[] | null;
  installation_photo_paths: LeadAttachment[] | null;
};

function dbToLead(r: DbLead): Lead {
  const warranty: Warranty | undefined = r.warranty_registered_at
    ? {
        type: (r.warranty_classification || "residential") as "residential" | "commercial",
        systemType: r.warranty_system_type || "Custom",
        installationDate: r.warranty_install_date || "",
        ownerName: r.warranty_building_owner_name || r.homeowner_name || "",
        ownerAddress: r.project_address || "",
        // ?? not || — a dealer literally on the ocean (0 miles) was
        // registering as inland because `0 || 99` evaluates to 99.
        nearOcean: (r.warranty_ocean_proximity_miles ?? 99) <= 5,
        workmanshipYears: r.warranty_dealer_workmanship_years || 1,
        photosUploaded: (r.warranty_photo_paths || []).length,
        attestation: true,
        signature: r.warranty_signed_by_name || "",
        registeredDate: formatDate(r.warranty_registered_at),
      }
    : undefined;

  return {
    id: r.id,
    customer: r.homeowner_name || "Unnamed",
    customerType: r.customer_type,
    city: r.city || "",
    province: r.province || "",
    email: r.homeowner_email || "",
    phone: r.homeowner_phone || "",
    address: r.project_address || "",
    projectType: r.product_interest || "—",
    estimatedSize: r.estimated_size || "",
    description: r.description || "",
    receivedDate: r.received_at,
    status: r.stage,
    scopeOfWork: r.scope_of_work || undefined,
    linealFootage: r.lineal_footage != null ? String(r.lineal_footage) : undefined,
    projectValue: r.project_value != null ? String(r.project_value) : undefined,
    orderNumber: r.order_number || undefined,
    lostReason: r.lost_reason || undefined,
    notes: r.notes || undefined,
    acceptedDate: r.accepted_at || undefined,
    bidDate: r.bid_submitted_at || undefined,
    closedDate: r.closed_at || undefined,
    warrantyRegistered: !!r.warranty_registered_at,
    warranty,
    // Meeting items
    projectName: r.project_name || undefined,
    contactCompany: r.contact_company || undefined,
    bidDueDate: r.bid_due_date || undefined,
    installationDate: r.installation_date || undefined,
    systemTypes: r.system_types || undefined,
    wonReason: r.won_reason || undefined,
    declineReason: r.decline_reason || undefined,
    leadAttachments: r.lead_attachment_paths || undefined,
    installationPhotos: r.installation_photo_paths || undefined,
  };
}

function WarrantyRegistrationFlow({
  lead,
  dealerName,
  onComplete,
  onCancel,
}: {
  lead: Lead;
  dealerName: string;
  onComplete: (warranty: Warranty) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [warrantyType, setWarrantyType] = useState<"residential" | "commercial">(suggestWarrantyType(lead));
  const [systemType, setSystemType] = useState(suggestSystemType(lead));

  const today = new Date().toISOString().split("T")[0];
  const [installationDate, setInstallationDate] = useState(today);
  const [ownerName, setOwnerName] = useState(lead.customer);
  const [ownerAddress, setOwnerAddress] = useState(lead.address || [lead.city, lead.province].filter(Boolean).join(", "));
  const [buildingAddress, setBuildingAddress] = useState("");
  const [nearOcean, setNearOcean] = useState(false);
  const [workmanshipYears, setWorkmanshipYears] = useState(2);
  const [photosUploaded, setPhotosUploaded] = useState(0);
  const [attestation, setAttestation] = useState(false);
  const [signature, setSignature] = useState(dealerName);

  function handleSubmit() {
    onComplete({
      type: warrantyType,
      systemType,
      installationDate,
      ownerName,
      ownerAddress,
      buildingAddress: buildingAddress || undefined,
      nearOcean,
      workmanshipYears,
      photosUploaded,
      attestation,
      signature,
      registeredDate: new Date().toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" }),
    });
  }

  function getFinishWarrantyYears(): number {
    if (warrantyType === "residential") return nearOcean ? 5 : 10;
    return nearOcean ? 1 : 5;
  }

  const isInfinity = systemType === "Infinity Topless Glass";

  function canAdvance(): boolean {
    if (step === 1) return !!warrantyType && !!systemType;
    if (step === 2) return !!installationDate && !!ownerName.trim() && !!ownerAddress.trim();
    if (step === 3) return workmanshipYears > 0 && workmanshipYears <= 25;
    if (step === 4) return attestation && !!signature.trim();
    return false;
  }

  return (
    <div className="fixed inset-0 z-[60] bg-ink/80 flex items-start justify-center overflow-y-auto p-4 md:p-8">
      <div role="dialog" aria-modal="true" aria-labelledby="warranty-title" className="bg-cream w-full max-w-2xl my-8 shadow-2xl">
        <div className="sticky top-0 bg-cream border-b border-stone-200 px-6 md:px-8 py-5 flex items-center justify-between z-10">
          <div>
            <p className="eyebrow text-gold mb-1">Warranty Registration</p>
            <h3 id="warranty-title" className="font-heading text-xl font-bold">Step {step} of {totalSteps}</h3>
          </div>
          <button onClick={onCancel} aria-label="Cancel warranty registration" className="text-stone-500 hover:text-ink text-2xl leading-none">×</button>
        </div>

        <div className="w-full h-1 bg-stone-200">
          <div className="h-full bg-gold transition-all duration-500" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
        </div>

        <div className="px-6 md:px-8 py-6">
          {step === 1 && (
            <div>
              <p className="eyebrow text-stone-500 mb-2">Project Classification</p>
              <h2 className="font-heading text-2xl font-bold mb-3">What type of installation is this?</h2>
              <p className="font-body text-sm text-stone-600 mb-6">Warranty coverage differs between residential and commercial projects.</p>

              <p className="eyebrow text-stone-600 mb-2">Warranty Type</p>
              <div className="space-y-2 mb-6">
                <label className={`flex items-start gap-3 p-4 border cursor-pointer transition-colors ${warrantyType === "residential" ? "border-gold bg-gold/5" : "border-stone-200 bg-white hover:border-stone-400"}`}>
                  <input type="radio" name="warrantyType" checked={warrantyType === "residential"} onChange={() => setWarrantyType("residential")} className="mt-1" />
                  <div>
                    <p className="font-body font-semibold">Residential</p>
                    <p className="font-body text-xs text-stone-600 mt-1">Single-family detached or detached duplex.</p>
                    <p className="font-body text-xs text-stone-500 mt-1">20-year structural · 10-year finish (5yr if within 5mi of ocean)</p>
                  </div>
                </label>
                <label className={`flex items-start gap-3 p-4 border cursor-pointer transition-colors ${warrantyType === "commercial" ? "border-gold bg-gold/5" : "border-stone-200 bg-white hover:border-stone-400"}`}>
                  <input type="radio" name="warrantyType" checked={warrantyType === "commercial"} onChange={() => setWarrantyType("commercial")} className="mt-1" />
                  <div>
                    <p className="font-body font-semibold">Commercial</p>
                    <p className="font-body text-xs text-stone-600 mt-1">Multi-family: condos, townhomes, apartments, commercial.</p>
                    <p className="font-body text-xs text-stone-500 mt-1">20-year structural · 5-year finish (1yr if within 5mi of ocean)</p>
                  </div>
                </label>
              </div>

              <p className="eyebrow text-stone-600 mb-2">System Type</p>
              <select value={systemType} onChange={(e) => setSystemType(e.target.value)} className="w-full border border-stone-300 px-4 py-3 font-body bg-white mb-2">
                <option>Infinity Topless Glass</option>
                <option>Glass Component</option>
                <option>Picket</option>
                <option>Custom</option>
              </select>
              {isInfinity && (<p className="font-body text-xs text-gold mt-2">★ Infinity installation — eligible for premium glass shelf bracket gift.</p>)}
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="eyebrow text-stone-500 mb-2">Installation Details</p>
              <h2 className="font-heading text-2xl font-bold mb-3">Confirm installation and ownership info</h2>
              <p className="font-body text-sm text-stone-600 mb-6">These fields match the official IAS warranty form.</p>

              <div className="space-y-4">
                <div>
                  <label className="eyebrow text-stone-600 block mb-1">Date of Installation</label>
                  <input type="date" value={installationDate} onChange={(e) => setInstallationDate(e.target.value)} className="w-full border border-stone-300 px-4 py-3 font-body bg-white" />
                </div>
                <div>
                  <label className="eyebrow text-stone-600 block mb-1">Building Owner&apos;s Name</label>
                  <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="w-full border border-stone-300 px-4 py-3 font-body bg-white" />
                </div>
                <div>
                  <label className="eyebrow text-stone-600 block mb-1">Building Owner&apos;s Address</label>
                  <input type="text" value={ownerAddress} onChange={(e) => setOwnerAddress(e.target.value)} className="w-full border border-stone-300 px-4 py-3 font-body bg-white" />
                </div>
                <div>
                  <label className="eyebrow text-stone-600 block mb-1">Building Address (if different)</label>
                  <input type="text" value={buildingAddress} onChange={(e) => setBuildingAddress(e.target.value)} placeholder="Leave blank if same as above" className="w-full border border-stone-300 px-4 py-3 font-body bg-white" />
                </div>
                <label className="flex items-start gap-3 p-4 bg-white border border-stone-200 cursor-pointer">
                  <input type="checkbox" checked={nearOcean} onChange={(e) => setNearOcean(e.target.checked)} className="mt-1" />
                  <div>
                    <p className="font-body text-sm font-semibold">Installation is within 5 miles of ocean / saltwater</p>
                    <p className="font-body text-xs text-stone-600 mt-1">Reduces finish coverage to {warrantyType === "residential" ? "5 years" : "1 year"}.</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="eyebrow text-stone-500 mb-2">Your Workmanship Guarantee</p>
              <h2 className="font-heading text-2xl font-bold mb-3">How long do you guarantee the installation?</h2>
              <p className="font-body text-sm text-stone-600 mb-4">Per Section 13 of the IAS warranty, the Installation Company is responsible for workmanship. You set the period.</p>

              <label className="eyebrow text-stone-600 block mb-2">Workmanship Warranty Period</label>
              <div className="flex items-center gap-3 mb-2">
                <input type="number" min="1" max="25" value={workmanshipYears} onChange={(e) => setWorkmanshipYears(parseInt(e.target.value) || 1)} className="w-24 border border-stone-300 px-4 py-3 font-body bg-white text-center text-lg font-bold" />
                <span className="font-body text-stone-600">years</span>
              </div>
              <p className="font-body text-xs text-stone-500 mb-6">Most dealers guarantee 1–3 years.</p>

              <div className="p-5 bg-ink text-cream">
                <p className="eyebrow text-gold mb-3">Warranty Summary Preview</p>
                <div className="space-y-2 text-sm font-body">
                  <div className="flex justify-between"><span className="text-cream/70">Type</span><span className="font-semibold capitalize">{warrantyType}</span></div>
                  <div className="flex justify-between"><span className="text-cream/70">System</span><span className="font-semibold">{systemType}</span></div>
                  <div className="flex justify-between"><span className="text-cream/70">IAS Structural</span><span className="font-semibold">20 years</span></div>
                  <div className="flex justify-between"><span className="text-cream/70">IAS Finish</span><span className="font-semibold">{getFinishWarrantyYears()} years</span></div>
                  <div className="flex justify-between"><span className="text-cream/70">Your Workmanship</span><span className="font-semibold text-gold">{workmanshipYears} {workmanshipYears === 1 ? "year" : "years"}</span></div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <p className="eyebrow text-stone-500 mb-2">Photos & Sign-off</p>
              <h2 className="font-heading text-2xl font-bold mb-3">Upload photos and confirm installation</h2>
              <p className="font-body text-sm text-stone-600 mb-6">Installation photos become part of our marketing library.</p>

              <div className="mb-6">
                <label className="eyebrow text-stone-600 block mb-2">Installation Photos (optional, recommended)</label>
                <div className="border-2 border-dashed border-stone-300 bg-white p-6 text-center">
                  <p className="font-body text-sm text-stone-600 mb-3">Upload 1–3 photos.</p>
                  <button onClick={() => setPhotosUploaded(Math.min(3, photosUploaded + 1))} disabled={photosUploaded >= 3} className="btn-outline-dark text-xs px-5 py-2 disabled:opacity-40">
                    {photosUploaded === 0 ? "Select Photos" : `${photosUploaded} photo${photosUploaded === 1 ? "" : "s"} selected (add more)`}
                  </button>
                  {photosUploaded > 0 && (
                    <div className="flex gap-2 mt-4 justify-center">
                      {Array.from({ length: photosUploaded }).map((_, i) => (
                        <div key={i} className="w-16 h-16 bg-stone-200 border border-stone-300 flex items-center justify-center text-stone-500 text-xs">IMG {i + 1}</div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="font-body text-xs text-stone-500 mt-2">Note: actual file upload to storage will be wired in next iteration.</p>
              </div>

              <div className="mb-6 p-4 bg-stone-100 border border-stone-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={attestation} onChange={(e) => setAttestation(e.target.checked)} className="mt-1 flex-shrink-0" />
                  <p className="font-body text-sm text-ink leading-relaxed">
                    <span className="font-semibold">I attest</span> that this installation has been performed in accordance with the most current standards and specifications set out by Innovative Aluminum Systems, Inc.
                  </p>
                </label>
              </div>

              <div>
                <label className="eyebrow text-stone-600 block mb-1">Installation Company Representative Signature</label>
                <input type="text" value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Type your full name to sign" className="w-full border border-stone-300 px-4 py-3 font-body bg-white italic" style={{ fontFamily: "cursive" }} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 mt-6 border-t border-stone-200">
            <button onClick={() => step > 1 ? setStep(step - 1) : onCancel()} className="text-xs font-body font-bold uppercase tracking-widest px-4 py-2 text-stone-600 hover:text-ink transition-colors">
              {step === 1 ? "Cancel" : "← Back"}
            </button>
            {step < totalSteps ? (
              <button onClick={() => setStep(step + 1)} disabled={!canAdvance()} className="btn-gold text-xs px-6 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
            ) : (
              <button onClick={handleSubmit} disabled={!canAdvance()} className="btn-gold text-xs px-6 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed">Register Warranty</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadDetailModal({
  lead,
  dealerName,
  onClose,
  onChanged,
}: {
  lead: Lead;
  dealerName: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [actionMode, setActionMode] = useState<
    "none" | "submit_bid" | "won" | "lost" | "decline"
  >("none");
  const [showWarrantyFlow, setShowWarrantyFlow] = useState(false);
  const [showWarrantySuccess, setShowWarrantySuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const [formData, setFormData] = useState({
    scopeOfWork: lead.scopeOfWork || "",
    linealFootage: lead.linealFootage || "",
    projectValue: lead.projectValue || "",
    orderNumber: lead.orderNumber || "",
    lostReason: lead.lostReason || "Price — we were higher",
    wonReason: lead.wonReason || WON_REASON_OPTIONS[0],
    declineReason: lead.declineReason || DECLINE_REASON_OPTIONS[0],
    notes: lead.notes || "",
    installationDate: lead.installationDate || "",
    systemTypes: lead.systemTypes || [],
  });

  // Escape closes the lead detail (unless mid-save or a warranty flow is
  // open — Escape should close the inner overlay first).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (saving || uploadingPhotos) return;
      if (showWarrantyFlow || showWarrantySuccess) return;
      if (actionMode !== "none") {
        setActionMode("none");
        return;
      }
      onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [saving, uploadingPhotos, showWarrantyFlow, showWarrantySuccess, actionMode, onClose]);

  // Re-sync formData when the underlying lead changes (e.g. after parent
  // re-fetches following a save), otherwise opening a fresh action mode
  // would show stale values from initial mount.
  useEffect(() => {
    setFormData({
      scopeOfWork: lead.scopeOfWork || "",
      linealFootage: lead.linealFootage || "",
      projectValue: lead.projectValue || "",
      orderNumber: lead.orderNumber || "",
      lostReason: lead.lostReason || "Price — we were higher",
      wonReason: lead.wonReason || WON_REASON_OPTIONS[0],
      declineReason: lead.declineReason || DECLINE_REASON_OPTIONS[0],
      notes: lead.notes || "",
      installationDate: lead.installationDate || "",
      systemTypes: lead.systemTypes || [],
    });
  }, [lead]);

  function toggleSystemType(s: string) {
    setFormData((prev) => ({
      ...prev,
      systemTypes: prev.systemTypes.includes(s)
        ? prev.systemTypes.filter((x) => x !== s)
        : [...prev.systemTypes, s],
    }));
  }

  async function saveUpdate(updates: Record<string, unknown>) {
    setSaving(true);
    setError("");
    const { error: updErr } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", lead.id);
    setSaving(false);
    if (updErr) {
      setError(humanizeError(updErr, "Couldn't save changes."));
      return false;
    }
    onChanged();
    return true;
  }

  async function handleAccept() {
    await saveUpdate({ stage: "accepted", accepted_at: new Date().toISOString() });
  }

  async function handleDecline() {
    const ok = await saveUpdate({
      stage: "declined",
      closed_at: new Date().toISOString(),
      decline_reason: formData.declineReason,
      notes: formData.notes,
    });
    if (ok) setActionMode("none");
  }

  // Helper — parseFloat that returns null for empty / non-numeric input
  // instead of NaN. Previously `parseFloat("abc")` silently wrote NaN into
  // numeric DB columns, which Postgres coerces to NULL but JS comparisons
  // do all sorts of weird things on.
  function parseNumOrNull(v: string | null | undefined): number | null {
    if (v == null || v === "") return null;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }

  async function handleSubmitBid() {
    const ok = await saveUpdate({
      stage: "bid_submitted",
      bid_submitted_at: new Date().toISOString(),
      scope_of_work: formData.scopeOfWork,
      lineal_footage: parseNumOrNull(formData.linealFootage),
      project_value: parseNumOrNull(formData.projectValue),
      installation_date: formData.installationDate || null,
      system_types: formData.systemTypes.length ? formData.systemTypes : null,
    });
    if (ok) setActionMode("none");
  }

  async function handleMarkWon() {
    const ok = await saveUpdate({
      stage: "won",
      closed_at: new Date().toISOString(),
      order_number: formData.orderNumber,
      scope_of_work: formData.scopeOfWork || lead.scopeOfWork || null,
      lineal_footage: parseNumOrNull(formData.linealFootage) ?? parseNumOrNull(lead.linealFootage),
      project_value: parseNumOrNull(formData.projectValue) ?? parseNumOrNull(lead.projectValue),
      installation_date: formData.installationDate || lead.installationDate || null,
      system_types: formData.systemTypes.length ? formData.systemTypes : (lead.systemTypes || null),
      won_reason: formData.wonReason,
      notes: formData.notes,
    });
    if (ok) setActionMode("none");
  }

  async function handleMarkLost() {
    const ok = await saveUpdate({
      stage: "lost",
      closed_at: new Date().toISOString(),
      lost_reason: formData.lostReason,
      notes: formData.notes,
    });
    if (ok) setActionMode("none");
  }

  async function handleUploadInstallPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadingPhotos(true);
    setError("");
    // Per-file cap. Modern phones produce 5–10 MB JPEGs; 25 MB leaves room
    // for HEIC + RAW without letting a 500 MB video tank the storage quota.
    const MAX_FILE_BYTES = 25 * 1024 * 1024;
    const oversized = Array.from(files).filter((f) => f.size > MAX_FILE_BYTES);
    if (oversized.length > 0) {
      setError(`Photo${oversized.length > 1 ? "s" : ""} too large (max 25 MB): ${oversized.map((f) => f.name).join(", ")}`);
      setUploadingPhotos(false);
      return;
    }
    // Persist after EACH successful upload so a mid-batch failure doesn't
    // orphan files in storage that the DB doesn't reference.
    let currentPaths: LeadAttachment[] = [...(lead.installationPhotos || [])];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `leads/${lead.id}/install/${Date.now()}-${i}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("private-documents")
        .upload(path, f, { contentType: f.type, upsert: false });
      if (upErr) {
        setError(`Upload failed at ${f.name}: ${upErr.message}. ${currentPaths.length - (lead.installationPhotos?.length || 0)} photo(s) before this were saved.`);
        setUploadingPhotos(false);
        return;
      }
      currentPaths = [
        ...currentPaths,
        { path, filename: f.name, uploaded_at: new Date().toISOString() },
      ];
      // Patch the row after each upload — if next one fails, DB is still consistent
      const ok = await saveUpdate({ installation_photo_paths: currentPaths });
      if (!ok) {
        setUploadingPhotos(false);
        return;
      }
    }
    setUploadingPhotos(false);
  }

  async function handleWarrantyComplete(w: Warranty) {
    const ok = await saveUpdate({
      warranty_registered_at: new Date().toISOString(),
      warranty_classification: w.type,
      warranty_system_type: w.systemType,
      warranty_install_date: w.installationDate,
      warranty_building_owner_name: w.ownerName,
      warranty_ocean_proximity_miles: w.nearOcean ? 1 : 99,
      warranty_dealer_workmanship_years: w.workmanshipYears,
      warranty_signed_by_name: w.signature,
      warranty_signed_at: new Date().toISOString(),
    });
    if (ok) {
      setShowWarrantyFlow(false);
      setShowWarrantySuccess(true);
    }
  }

  const statusConfig = STATUS_CONFIG[lead.status];
  const overdue = isOverdue(lead);
  const locationDisplay = [lead.city, lead.province].filter(Boolean).join(", ") || lead.address;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-ink/70 flex items-start justify-center overflow-y-auto p-4 md:p-8">
        <div role="dialog" aria-modal="true" aria-labelledby="lead-detail-title" className="bg-cream w-full max-w-3xl lg:max-w-4xl my-8 shadow-2xl">
          <div className="sticky top-0 bg-cream border-b border-stone-200 px-6 md:px-8 py-5 flex items-center justify-between z-10">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="eyebrow text-stone-500">Lead Detail</p>
              <span className={`text-xs uppercase tracking-wider px-3 py-1 font-bold ${statusConfig.bg} ${statusConfig.color}`}>{statusConfig.label}</span>
              {lead.customerType && (
                <span className="text-xs uppercase tracking-wider px-3 py-1 font-bold bg-stone-200 text-stone-700 capitalize">
                  {lead.customerType}
                </span>
              )}
              {overdue && <span className="text-xs uppercase tracking-wider px-3 py-1 font-bold bg-red-600 text-white">Overdue</span>}
            </div>
            <button onClick={onClose} aria-label="Close lead details" className="text-stone-500 hover:text-ink text-2xl leading-none">×</button>
          </div>

          <div className="px-6 md:px-8 py-6">
            <div className="mb-6">
              <h2 id="lead-detail-title" className="font-heading text-3xl font-bold mb-1">{lead.customer}</h2>
              {locationDisplay && <p className="font-body text-stone-600">{locationDisplay}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-stone-200">
              <div>
                <p className="eyebrow text-stone-500 mb-2">Contact</p>
                <p className="font-body text-sm">{lead.email || "—"}</p>
                <p className="font-body text-sm">{lead.phone || "—"}</p>
              </div>
              <div>
                <p className="eyebrow text-stone-500 mb-2">Received</p>
                <p className="font-body text-sm">{formatDate(lead.receivedDate)}</p>
                <p className="font-body text-xs text-stone-500">{getDaysAgo(lead.receivedDate)} days ago</p>
              </div>
            </div>

            {(lead.projectName || lead.contactCompany || lead.bidDueDate) && (
              <div className="mb-6 pb-6 border-b border-stone-200">
                <p className="eyebrow text-stone-500 mb-2">Project</p>
                {lead.projectName && <p className="font-body font-semibold text-lg mb-1">{lead.projectName}</p>}
                <div className="space-y-1 text-sm font-body text-stone-600 mt-2">
                  {lead.contactCompany && <div><span className="text-stone-500">Contracting company:</span> <span className="font-semibold text-ink">{lead.contactCompany}</span></div>}
                  {lead.bidDueDate && (
                    <div>
                      <span className="text-stone-500">Bid due:</span>{" "}
                      <span className={`font-semibold ${getDaysAgo(lead.bidDueDate) > 0 ? "text-red-700" : "text-ink"}`}>
                        {formatDate(lead.bidDueDate)}
                        {getDaysAgo(lead.bidDueDate) > 0 && " (overdue)"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(lead.projectType !== "—" || lead.estimatedSize || lead.description || (lead.systemTypes && lead.systemTypes.length > 0)) && (
              <div className="mb-6 pb-6 border-b border-stone-200">
                <p className="eyebrow text-stone-500 mb-2">Scope</p>
                {lead.projectType !== "—" && <p className="font-body font-semibold mb-1">{lead.projectType}</p>}
                {lead.estimatedSize && <p className="font-body text-sm text-stone-600 mb-3">{lead.estimatedSize}</p>}
                {lead.description && <p className="font-body text-sm text-stone-600 leading-relaxed mb-3">{lead.description}</p>}
                {lead.systemTypes && lead.systemTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {lead.systemTypes.map((s) => (
                      <span key={s} className="inline-block px-2 py-1 text-xs font-body bg-stone-100 border border-stone-300 text-stone-700">{s}</span>
                    ))}
                  </div>
                )}
                {lead.installationDate && (
                  <p className="text-sm font-body text-stone-600 mt-3">
                    <span className="text-stone-500">Estimated first install:</span>{" "}
                    <span className="font-semibold text-ink">{formatDate(lead.installationDate)}</span>
                  </p>
                )}
              </div>
            )}

            {lead.notes && lead.status === "new" && (
              <div className="mb-6 pb-6 border-b border-stone-200">
                <p className="eyebrow text-stone-500 mb-2">Notes from IAS</p>
                <p className="font-body text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">{lead.notes}</p>
              </div>
            )}

            <div className="mb-6 pb-6 border-b border-stone-200">
              <p className="eyebrow text-stone-500 mb-3">Timeline</p>
              <div className="space-y-2 text-sm font-body">
                <div className="flex justify-between"><span className="text-stone-600">Received from IAS</span><span className="font-semibold">{formatDate(lead.receivedDate)}</span></div>
                {lead.acceptedDate && <div className="flex justify-between"><span className="text-stone-600">Accepted</span><span className="font-semibold">{formatDate(lead.acceptedDate)}</span></div>}
                {lead.bidDate && <div className="flex justify-between"><span className="text-stone-600">Bid submitted</span><span className="font-semibold">{formatDate(lead.bidDate)}</span></div>}
                {lead.closedDate && <div className="flex justify-between"><span className="text-stone-600">Closed ({lead.status})</span><span className="font-semibold">{formatDate(lead.closedDate)}</span></div>}
                {lead.warranty && <div className="flex justify-between"><span className="text-stone-600">Warranty registered</span><span className="font-semibold text-gold">{lead.warranty.registeredDate}</span></div>}
              </div>
            </div>

            {(lead.scopeOfWork || lead.projectValue || lead.lostReason || lead.wonReason || lead.declineReason || (lead.notes && lead.status !== "new")) && (
              <div className="mb-6 pb-6 border-b border-stone-200">
                <p className="eyebrow text-stone-500 mb-3">Outcome Details</p>
                <div className="space-y-2 text-sm font-body">
                  {lead.scopeOfWork && <div><span className="text-stone-600">Scope: </span><span className="font-semibold">{lead.scopeOfWork}</span></div>}
                  {lead.linealFootage && <div><span className="text-stone-600">Lineal footage: </span><span className="font-semibold">{lead.linealFootage} LF</span></div>}
                  {lead.projectValue && Number.isFinite(parseFloat(lead.projectValue)) && <div><span className="text-stone-600">Railing cost: </span><span className="font-semibold">${Math.round(parseFloat(lead.projectValue)).toLocaleString()}</span></div>}
                  {lead.orderNumber && <div><span className="text-stone-600">Order #: </span><span className="font-semibold">{lead.orderNumber}</span></div>}
                  {lead.wonReason && <div><span className="text-stone-600">Reason won: </span><span className="font-semibold">{lead.wonReason}</span></div>}
                  {lead.lostReason && <div><span className="text-stone-600">Reason lost: </span><span className="font-semibold">{lead.lostReason}</span></div>}
                  {lead.declineReason && <div><span className="text-stone-600">Reason declined: </span><span className="font-semibold">{lead.declineReason}</span></div>}
                  {lead.notes && lead.status !== "new" && <div><span className="text-stone-600">Notes: </span><span className="font-semibold">{lead.notes}</span></div>}
                </div>
              </div>
            )}

            {lead.warranty && (
              <div className="mb-6 pb-6 border-b border-stone-200">
                <p className="eyebrow text-gold mb-3">Warranty — Registered</p>
                <div className="bg-gold/5 border-l-4 border-gold p-5">
                  <div className="space-y-2 text-sm font-body">
                    <div className="flex justify-between"><span className="text-stone-600">Type</span><span className="font-semibold capitalize">{lead.warranty.type}</span></div>
                    <div className="flex justify-between"><span className="text-stone-600">System</span><span className="font-semibold">{lead.warranty.systemType}</span></div>
                    <div className="flex justify-between"><span className="text-stone-600">Installed</span><span className="font-semibold">{lead.warranty.installationDate}</span></div>
                    <div className="flex justify-between"><span className="text-stone-600">IAS Structural</span><span className="font-semibold">20 years</span></div>
                    <div className="flex justify-between"><span className="text-stone-600">IAS Finish</span><span className="font-semibold">{lead.warranty.type === "residential" ? (lead.warranty.nearOcean ? "5" : "10") : (lead.warranty.nearOcean ? "1" : "5")} years</span></div>
                    <div className="flex justify-between"><span className="text-stone-600">Your Workmanship</span><span className="font-semibold">{lead.warranty.workmanshipYears} years</span></div>
                    <div className="flex justify-between"><span className="text-stone-600">Signed by</span><span className="font-semibold italic">{lead.warranty.signature}</span></div>
                  </div>
                </div>
              </div>
            )}

            {lead.status === "won" && actionMode === "none" && (
              <div className="mb-6 p-5 bg-stone-50 border border-stone-200">
                <p className="eyebrow text-stone-500 mb-2">Installation photos</p>
                <h4 className="font-heading text-base font-bold mb-2">Share photos of the finished install</h4>
                <p className="font-body text-sm text-stone-600 mb-3">
                  We use these for marketing, social posts, and to prove the quality of your work.
                  High-res is best. Drone shots welcome.
                </p>
                {lead.installationPhotos && lead.installationPhotos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                    {lead.installationPhotos.map((p) => (
                      <div key={p.path} className="text-xs font-body bg-white border border-stone-200 px-2 py-1.5 truncate" title={p.filename}>
                        ✓ {p.filename}
                      </div>
                    ))}
                  </div>
                )}
                <label className="inline-block">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleUploadInstallPhotos(e.target.files)}
                    disabled={uploadingPhotos}
                  />
                  <span className={`btn-outline-dark text-xs px-4 py-2 cursor-pointer inline-block ${uploadingPhotos ? "opacity-50" : ""}`}>
                    {uploadingPhotos ? "Uploading…" : (lead.installationPhotos && lead.installationPhotos.length > 0 ? "Add more photos" : "Upload photos")}
                  </span>
                </label>
              </div>
            )}

            {lead.status === "won" && !lead.warrantyRegistered && actionMode === "none" && (
              <div className="mb-6 p-5 bg-gold/15 border-l-4 border-gold">
                <p className="eyebrow text-gold mb-2">Phase 3 · Lifecycle Value</p>
                <h4 className="font-heading text-lg font-bold mb-2">Project complete? Register the warranty.</h4>
                <p className="font-body text-sm text-stone-700 mb-3">
                  Digital version of the official IAS warranty form. Closes the loop — homeowner receives $50 Starbucks gift card and joins our maintenance reminder system.
                </p>
                <button onClick={() => setShowWarrantyFlow(true)} className="btn-gold text-xs px-5 py-2.5">Start Warranty Registration →</button>
              </div>
            )}

            {actionMode === "submit_bid" && (
              <div className="mb-6 p-5 bg-cream-dark">
                <h4 className="font-heading text-lg font-bold mb-4">Submit Bid</h4>
                <div className="space-y-4">
                  <div>
                    <label className="eyebrow text-stone-600 block mb-1">Scope of Work</label>
                    <textarea value={formData.scopeOfWork} onChange={(e) => setFormData({ ...formData, scopeOfWork: e.target.value })} maxLength={2000} className="w-full border border-stone-300 px-3 py-2 text-sm font-body bg-white" rows={3} />
                  </div>
                  <div>
                    <label className="eyebrow text-stone-600 block mb-2">System Type(s)</label>
                    <div className="flex flex-wrap gap-2">
                      {SYSTEM_TYPE_OPTIONS.map((s) => {
                        const on = formData.systemTypes.includes(s);
                        return (
                          <button key={s} type="button" onClick={() => toggleSystemType(s)}
                            className={`px-3 py-1.5 text-xs font-body border ${on ? "bg-ink text-cream border-ink" : "bg-white text-stone-700 border-stone-300 hover:border-ink"}`}>
                            {on ? "✓ " : ""}{s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="eyebrow text-stone-600 block mb-1">Lineal Footage</label>
                      <input type="text" value={formData.linealFootage} onChange={(e) => setFormData({ ...formData, linealFootage: e.target.value })} className="w-full border border-stone-300 px-3 py-2 text-sm font-body bg-white" />
                    </div>
                    <div>
                      <label className="eyebrow text-stone-600 block mb-1">Railing Cost ($)</label>
                      <input type="text" value={formData.projectValue} onChange={(e) => setFormData({ ...formData, projectValue: e.target.value })} className="w-full border border-stone-300 px-3 py-2 text-sm font-body bg-white" placeholder="e.g. 24500" />
                      <p className="text-xs text-stone-500 font-body mt-1 italic">What IAS is charging — not your sell price.</p>
                    </div>
                  </div>
                  <div>
                    <label className="eyebrow text-stone-600 block mb-1">Estimated First Installation Date</label>
                    <input type="date" value={formData.installationDate} onChange={(e) => setFormData({ ...formData, installationDate: e.target.value })} className="w-full border border-stone-300 px-3 py-2 text-sm font-body bg-white" />
                    <p className="text-xs text-stone-500 font-body mt-1 italic">When the first delivery / install would be — helps IAS plan manufacturing.</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleSubmitBid} disabled={saving} className="btn-gold text-xs px-5 py-2 disabled:opacity-50">{saving ? "Saving…" : "Save Bid"}</button>
                    <button onClick={() => setActionMode("none")} className="btn-outline-dark text-xs px-5 py-2">Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {actionMode === "won" && (
              <div className="mb-6 p-5 bg-cream-dark">
                <h4 className="font-heading text-lg font-bold mb-4">Mark as Won</h4>
                <div className="space-y-4">
                  <div>
                    <label className="eyebrow text-stone-600 block mb-1">Final Scope of Work</label>
                    <textarea value={formData.scopeOfWork} onChange={(e) => setFormData({ ...formData, scopeOfWork: e.target.value })} maxLength={2000} className="w-full border border-stone-300 px-3 py-2 text-sm font-body bg-white" rows={2} />
                  </div>
                  <div>
                    <label className="eyebrow text-stone-600 block mb-2">System Type(s)</label>
                    <div className="flex flex-wrap gap-2">
                      {SYSTEM_TYPE_OPTIONS.map((s) => {
                        const on = formData.systemTypes.includes(s);
                        return (
                          <button key={s} type="button" onClick={() => toggleSystemType(s)}
                            className={`px-3 py-1.5 text-xs font-body border ${on ? "bg-ink text-cream border-ink" : "bg-white text-stone-700 border-stone-300 hover:border-ink"}`}>
                            {on ? "✓ " : ""}{s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="eyebrow text-stone-600 block mb-1">Lineal Footage</label>
                      <input type="text" value={formData.linealFootage} onChange={(e) => setFormData({ ...formData, linealFootage: e.target.value })} className="w-full border border-stone-300 px-3 py-2 text-sm font-body bg-white" />
                    </div>
                    <div>
                      <label className="eyebrow text-stone-600 block mb-1">Final Railing Cost ($)</label>
                      <input type="text" value={formData.projectValue} onChange={(e) => setFormData({ ...formData, projectValue: e.target.value })} className="w-full border border-stone-300 px-3 py-2 text-sm font-body bg-white" />
                    </div>
                  </div>
                  <div>
                    <label className="eyebrow text-stone-600 block mb-1">Estimated First Installation Date</label>
                    <input type="date" value={formData.installationDate} onChange={(e) => setFormData({ ...formData, installationDate: e.target.value })} className="w-full border border-stone-300 px-3 py-2 text-sm font-body bg-white" />
                  </div>
                  <div>
                    <label className="eyebrow text-stone-600 block mb-1">IAS Order Number</label>
                    <input type="text" value={formData.orderNumber} onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })} className="w-full border border-stone-300 px-3 py-2 text-sm font-body bg-white" />
                  </div>
                  <div>
                    <label className="eyebrow text-stone-600 block mb-1">Why did we win this?</label>
                    <select value={formData.wonReason} onChange={(e) => setFormData({ ...formData, wonReason: e.target.value })} className="w-full border border-stone-300 px-3 py-2 text-sm font-body bg-white">
                      {WON_REASON_OPTIONS.map((r) => <option key={r}>{r}</option>)}
                    </select>
                    <p className="text-xs text-stone-500 font-body mt-1 italic">Helps IAS understand where we&apos;re competitive.</p>
                  </div>
                  <div>
                    <label className="eyebrow text-stone-600 block mb-1">Notes (optional)</label>
                    <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} maxLength={5000} className="w-full border border-stone-300 px-3 py-2 text-sm font-body bg-white" rows={2} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleMarkWon} disabled={saving} className="btn-gold text-xs px-5 py-2 disabled:opacity-50">{saving ? "Saving…" : "Confirm Won"}</button>
                    <button onClick={() => setActionMode("none")} className="btn-outline-dark text-xs px-5 py-2">Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {actionMode === "lost" && (
              <div className="mb-6 p-5 bg-cream-dark">
                <h4 className="font-heading text-lg font-bold mb-4">Mark as Lost</h4>
                <div className="space-y-4">
                  <div>
                    <label className="eyebrow text-stone-600 block mb-1">Reason</label>
                    <select value={formData.lostReason} onChange={(e) => setFormData({ ...formData, lostReason: e.target.value })} className="w-full border border-stone-300 px-3 py-2 text-sm font-body bg-white">
                      <option>Price — we were higher</option>
                      <option>Timing — couldn&apos;t meet deadline</option>
                      <option>Customer went with another dealer</option>
                      <option>Customer chose different material/system</option>
                      <option>Customer didn&apos;t proceed with project</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="eyebrow text-stone-600 block mb-1">Notes (optional)</label>
                    <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} maxLength={5000} className="w-full border border-stone-300 px-3 py-2 text-sm font-body bg-white" rows={2} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleMarkLost} disabled={saving} className="btn-gold text-xs px-5 py-2 disabled:opacity-50">{saving ? "Saving…" : "Confirm Lost"}</button>
                    <button onClick={() => setActionMode("none")} className="btn-outline-dark text-xs px-5 py-2">Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {actionMode === "decline" && (
              <div className="mb-6 p-5 bg-cream-dark">
                <h4 className="font-heading text-lg font-bold mb-4">Decline Lead</h4>
                <p className="font-body text-sm text-stone-700 mb-4">
                  Pass on this lead so IAS can route it to another dealer. Different from &ldquo;Lost&rdquo; — Decline means you never took it on.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="eyebrow text-stone-600 block mb-1">Why are you declining?</label>
                    <select value={formData.declineReason} onChange={(e) => setFormData({ ...formData, declineReason: e.target.value })} className="w-full border border-stone-300 px-3 py-2 text-sm font-body bg-white">
                      {DECLINE_REASON_OPTIONS.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="eyebrow text-stone-600 block mb-1">Notes (optional)</label>
                    <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} maxLength={5000} className="w-full border border-stone-300 px-3 py-2 text-sm font-body bg-white" rows={2} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleDecline} disabled={saving} className="btn-gold text-xs px-5 py-2 disabled:opacity-50">{saving ? "Saving…" : "Confirm Decline"}</button>
                    <button onClick={() => setActionMode("none")} className="btn-outline-dark text-xs px-5 py-2">Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-600 font-body mb-4">{error}</p>}

            {actionMode === "none" && (
              <div className="flex flex-wrap gap-2">
                {lead.status === "new" && (
                  <>
                    <button onClick={handleAccept} disabled={saving} className="btn-gold text-xs px-5 py-2.5 disabled:opacity-50">{saving ? "Saving…" : "Accept Lead"}</button>
                    <button onClick={() => setActionMode("decline")} className="btn-outline-dark text-xs px-5 py-2.5">Decline Lead</button>
                  </>
                )}
                {lead.status === "accepted" && (
                  <>
                    <button onClick={() => setActionMode("submit_bid")} className="btn-gold text-xs px-5 py-2.5">Submit Bid</button>
                    <button onClick={() => setActionMode("won")} className="btn-outline-dark text-xs px-5 py-2.5">Mark Won</button>
                    <button onClick={() => setActionMode("lost")} className="btn-outline-dark text-xs px-5 py-2.5">Mark Lost</button>
                  </>
                )}
                {lead.status === "bid_submitted" && (
                  <>
                    <button onClick={() => setActionMode("won")} className="btn-gold text-xs px-5 py-2.5">Mark as Won</button>
                    <button onClick={() => setActionMode("lost")} className="btn-outline-dark text-xs px-5 py-2.5">Mark as Lost</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showWarrantyFlow && (
        <WarrantyRegistrationFlow lead={lead} dealerName={dealerName} onComplete={handleWarrantyComplete} onCancel={() => setShowWarrantyFlow(false)} />
      )}

      {showWarrantySuccess && lead.warranty && (
        <div className="fixed inset-0 z-[70] bg-ink/80 flex items-center justify-center p-4">
          <div className="bg-cream w-full max-w-xl shadow-2xl">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-5">
                <svg width="36" height="36" viewBox="0 0 20 20" fill="none">
                  <path d="M5 10L9 14L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="eyebrow text-gold mb-2">Warranty Registered</p>
              <h2 className="font-heading text-3xl font-bold mb-3">Closed loop complete.</h2>
              <p className="font-body text-stone-600 mb-6 leading-relaxed">{lead.warranty.ownerName}&apos;s warranty has been recorded.</p>
            </div>
            <div className="bg-cream-dark px-8 py-6 border-t border-stone-200">
              <p className="eyebrow text-stone-600 mb-4">What happens next</p>
              <div className="space-y-3 text-sm font-body">
                <div className="flex gap-3 items-start"><span className="text-gold font-bold">✓</span><span>Homeowner receives welcome email + <strong>$50 Starbucks gift card</strong></span></div>
                {lead.warranty.systemType === "Infinity Topless Glass" && <div className="flex gap-3 items-start"><span className="text-gold font-bold">✓</span><span>Premium <strong>glass shelf bracket gift</strong> scheduled</span></div>}
                <div className="flex gap-3 items-start"><span className="text-gold font-bold">✓</span><span>Added to 3-month maintenance reminder system</span></div>
                <div className="flex gap-3 items-start"><span className="text-gold font-bold">✓</span><span>Your workmanship warranty ({lead.warranty.workmanshipYears} years) recorded on file</span></div>
              </div>
            </div>
            <div className="p-6 text-center">
              <button onClick={() => { setShowWarrantySuccess(false); onClose(); }} className="btn-gold text-xs px-8 py-3">Done</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function LeadsPage() {
  const router = useRouter();
  const [dealerName, setDealerName] = useState("Dealer");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "closed">("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .maybeSingle();
      if (profile?.full_name) setDealerName(profile.full_name);

      const { data: rows } = await supabase
        .from("leads")
        .select("*")
        .order("received_at", { ascending: false });

      setLeads((rows || []).map((r) => dbToLead(r as DbLead)));
      setLoading(false);
    }
    load();
  }, [router, refreshKey]);

  function handleLeadChanged() {
    setRefreshKey((k) => k + 1);
  }

  useEffect(() => {
    if (selectedLead) {
      const fresh = leads.find((l) => l.id === selectedLead.id);
      if (fresh) setSelectedLead(fresh);
    }
  }, [leads, selectedLead]);

  if (loading) {
    return <div className="section-container section-padding"><p className="text-stone-600">Loading...</p></div>;
  }

  const filteredLeads = leads.filter((lead) => {
    if (activeFilter === "active") return ["new", "accepted", "bid_submitted"].includes(lead.status);
    if (activeFilter === "closed") return ["won", "lost"].includes(lead.status);
    return true;
  });

  const newCount = leads.filter((l) => l.status === "new").length;
  const overdueCount = leads.filter((l) => isOverdue(l)).length;
  const activeCount = leads.filter((l) => ["new", "accepted", "bid_submitted"].includes(l.status)).length;
  const wonCount = leads.filter((l) => l.status === "won").length;

  return (
    <div className="bg-cream min-h-screen">
      <div className="sticky top-0 z-30 bg-cream border-b border-stone-200">
        <div className="section-container py-5">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-body text-stone-600 hover:text-ink transition-colors">← Dashboard</Link>
            <span className="text-stone-300">/</span>
            <p className="eyebrow text-stone-600">Leads</p>
          </div>
        </div>
      </div>

      <div className="section-container pt-12 pb-24">
        <div className="mb-10">
          <p className="eyebrow text-gold mb-3">Pipeline</p>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-3">Leads</h1>
          <p className="font-body text-stone-600 max-w-2xl">
            Customer leads sent to you from IAS. Respond within 2 business days. Capture outcomes so we can support you with stalled bids and high-value builder relationships.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white border border-stone-200 p-5">
            <p className="eyebrow text-stone-500 mb-2">Action Needed</p>
            <p className="text-3xl font-heading font-bold">{newCount}</p>
            {overdueCount > 0 && <p className="text-xs text-red-600 font-body font-semibold uppercase tracking-wider mt-1">{overdueCount} overdue</p>}
          </div>
          <div className="bg-white border border-stone-200 p-5">
            <p className="eyebrow text-stone-500 mb-2">Active</p>
            <p className="text-3xl font-heading font-bold">{activeCount}</p>
            <p className="text-xs text-stone-500 font-body mt-1">In progress</p>
          </div>
          <div className="bg-white border border-stone-200 p-5">
            <p className="eyebrow text-stone-500 mb-2">Won</p>
            <p className="text-3xl font-heading font-bold">{wonCount}</p>
            <p className="text-xs text-stone-500 font-body mt-1">All time</p>
          </div>
          <div className="bg-white border border-stone-200 p-5">
            <p className="eyebrow text-stone-500 mb-2">Total Value Won</p>
            <p className="text-3xl font-heading font-bold">
              ${leads.filter((l) => l.status === "won").reduce((sum, l) => {
                const n = parseFloat(l.projectValue || "0");
                return sum + (Number.isFinite(n) ? n : 0);
              }, 0).toLocaleString()}
            </p>
            <p className="text-xs text-stone-500 font-body mt-1">Project value</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 border-b border-stone-200">
          {[
            { id: "all" as const, label: `All Leads (${leads.length})` },
            { id: "active" as const, label: `Active (${activeCount})` },
            { id: "closed" as const, label: `Closed (${leads.filter((l) => ["won", "lost"].includes(l.status)).length})` },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveFilter(tab.id)} className={`px-5 py-3 text-xs font-body font-bold uppercase tracking-widest border-b-2 transition-colors ${activeFilter === tab.id ? "border-gold text-ink" : "border-transparent text-stone-500 hover:text-ink"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-3 mb-12">
          {filteredLeads.length === 0 ? (
            <div className="bg-white border border-stone-200 p-12 text-center"><p className="font-body text-stone-500">No leads in this view.</p></div>
          ) : (
            filteredLeads.map((lead) => {
              const statusConfig = STATUS_CONFIG[lead.status];
              const overdue = isOverdue(lead);
              const locationDisplay = [lead.city, lead.province].filter(Boolean).join(", ") || lead.address.split(",").slice(-2).join(",").trim();
              return (
                <button key={lead.id} onClick={() => setSelectedLead(lead)} className="w-full text-left bg-white border border-stone-200 hover:border-gold hover:shadow-md transition-all p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-xs uppercase tracking-wider px-2.5 py-0.5 font-bold ${statusConfig.bg} ${statusConfig.color}`}>{statusConfig.label}</span>
                        {lead.customerType && (
                          <span className="text-xs uppercase tracking-wider px-2.5 py-0.5 font-bold bg-stone-200 text-stone-700 capitalize">
                            {lead.customerType}
                          </span>
                        )}
                        {overdue && <span className="text-xs uppercase tracking-wider px-2.5 py-0.5 font-bold bg-red-600 text-white">Overdue</span>}
                        {lead.status === "won" && !lead.warrantyRegistered && <span className="text-xs uppercase tracking-wider px-2.5 py-0.5 font-bold bg-gold/20 text-gold border border-gold">Register Warranty</span>}
                        {lead.warrantyRegistered && <span className="text-xs uppercase tracking-wider px-2.5 py-0.5 font-bold bg-green-100 text-green-900">Warranty ✓</span>}
                      </div>
                      <h3 className="font-heading text-lg font-bold mb-1">{lead.customer}</h3>
                      {locationDisplay && <p className="font-body text-sm text-stone-600 mb-1">{locationDisplay}</p>}
                      {lead.phone && <p className="font-body text-xs text-stone-500">{lead.phone}</p>}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs font-body text-stone-500 uppercase tracking-wider">Received</p>
                        <p className="text-sm font-body font-semibold">{formatDate(lead.receivedDate)}</p>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-stone-400 flex-shrink-0">
                        <path d="M7 5L13 10L7 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="bg-ink text-cream p-8 mb-8">
          <p className="eyebrow text-gold mb-3">The Closed Loop</p>
          <h3 className="font-heading text-2xl font-bold mb-3">Every won lead unlocks lifecycle value.</h3>
          <p className="font-body text-sm text-cream/80 leading-relaxed max-w-2xl">
            When you mark a project as Won and register the warranty, the homeowner receives a $50 Starbucks gift card and is added to our maintenance reminder system. Three-month maintenance touchpoints keep the brand top-of-mind.
          </p>
        </div>
      </div>

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          dealerName={dealerName}
          onClose={() => setSelectedLead(null)}
          onChanged={handleLeadChanged}
        />
      )}
    </div>
  );
}
