"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Dealer = { name: string; email: string };

type LeadStatus = "new" | "accepted" | "bid_submitted" | "won" | "lost";

type Lead = {
  id: string;
  customer: string;
  email: string;
  phone: string;
  address: string;
  projectType: string;
  estimatedSize: string;
  description: string;
  receivedDate: string;
  status: LeadStatus;
  bidSubmitted?: boolean;
  scopeOfWork?: string;
  linealFootage?: string;
  projectValue?: string;
  orderNumber?: string;
  completed?: boolean;
  warrantyRegistered?: boolean;
  lostReason?: string;
  wereHigher?: string;
  notes?: string;
  acceptedDate?: string;
  bidDate?: string;
  closedDate?: string;
  // Warranty fields (from actual IAS warranty PDF)
  warranty?: {
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
};

const SAMPLE_LEADS: Lead[] = [
  {
    id: "lead_001",
    customer: "Jim Smith",
    email: "jim.smith@example.com",
    phone: "(604) 555-0142",
    address: "1247 Maple Drive, Surrey, BC V3R 2K8",
    projectType: "Backyard deck railing — Infinity Topless Glass",
    estimatedSize: "~80 lineal feet",
    description: "Homeowner replacing old wood railing on rear deck. Two-story home, deck is 12ft above ground. Looking for unobstructed mountain view, prefers black frame.",
    receivedDate: "Apr 22, 2026",
    status: "new",
  },
  {
    id: "lead_002",
    customer: "Sarah Liu",
    email: "sarah.liu@example.com",
    phone: "(604) 555-0288",
    address: "892 Oak Avenue, Langley, BC V2Y 1H4",
    projectType: "Front porch railing — Picket",
    estimatedSize: "~32 lineal feet",
    description: "New construction. Wants picket style to match heritage home aesthetic. White finish requested. Stairs included.",
    receivedDate: "Apr 20, 2026",
    status: "accepted",
    acceptedDate: "Apr 21, 2026",
  },
  {
    id: "lead_003",
    customer: "Mike Chen",
    email: "mike.chen@example.com",
    phone: "(604) 555-0419",
    address: "445 Pacific Boulevard, Vancouver, BC V6Z 3A3",
    projectType: "Pool surround — Infinity Topless Glass",
    estimatedSize: "~120 lineal feet",
    description: "Pool safety code compliance required. Custom L-shape around pool with stair access. Quote needed for July install.",
    receivedDate: "Apr 18, 2026",
    status: "bid_submitted",
    acceptedDate: "Apr 19, 2026",
    bidDate: "Apr 22, 2026",
    bidSubmitted: true,
    scopeOfWork: "120 LF Infinity Topless Glass with Black frame, includes 2 stair sections, fascia mount",
    linealFootage: "120",
    projectValue: "18500",
  },
  {
    id: "lead_004",
    customer: "Heritage Homes Construction",
    email: "projects@heritagehomes.ca",
    phone: "(604) 555-0750",
    address: "Multi-family complex — Burnaby, BC",
    projectType: "Multi-family balcony railing — Picket",
    estimatedSize: "~840 lineal feet across 12 units",
    description: "Builder doing 12-unit townhouse complex. Needs balcony railings for each unit. Repeat builder, has done 3 previous projects with our dealer network.",
    receivedDate: "Apr 5, 2026",
    status: "won",
    acceptedDate: "Apr 5, 2026",
    bidDate: "Apr 8, 2026",
    closedDate: "Apr 15, 2026",
    bidSubmitted: true,
    scopeOfWork: "840 LF Picket railing across 12 units, white finish, includes installation",
    linealFootage: "840",
    projectValue: "67200",
    orderNumber: "ORD-2026-0418",
    completed: false,
    warrantyRegistered: false,
  },
];

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string; description: string }> = {
  new: { label: "New", color: "text-ink", bg: "bg-gold", description: "New lead from IAS. Respond within 2 business days." },
  accepted: { label: "Accepted", color: "text-blue-900", bg: "bg-blue-100", description: "Lead accepted. Working on quote." },
  bid_submitted: { label: "Bid Submitted", color: "text-amber-900", bg: "bg-amber-100", description: "Quote sent to customer. Awaiting decision." },
  won: { label: "Won", color: "text-green-900", bg: "bg-green-100", description: "Project secured. Completion pending." },
  lost: { label: "Lost", color: "text-stone-700", bg: "bg-stone-200", description: "Project went to another bidder." },
};

function getDaysAgo(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date("2026-04-24");
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function isOverdue(lead: Lead): boolean {
  if (lead.status !== "new") return false;
  return getDaysAgo(lead.receivedDate) > 2;
}

// Detect warranty type from project description
function suggestWarrantyType(lead: Lead): "residential" | "commercial" {
  const text = (lead.projectType + " " + lead.description).toLowerCase();
  if (text.includes("multi-family") || text.includes("condo") || text.includes("townhouse") ||
      text.includes("apartment") || text.includes("commercial") || text.includes("builder")) {
    return "commercial";
  }
  return "residential";
}

// Detect system type
function suggestSystemType(lead: Lead): string {
  const text = lead.projectType.toLowerCase();
  if (text.includes("infinity")) return "Infinity Topless Glass";
  if (text.includes("glass component") || (text.includes("glass") && !text.includes("infinity"))) return "Glass Component";
  if (text.includes("picket")) return "Picket";
  return "Custom";
}

// ---------- WARRANTY REGISTRATION MULTI-STEP FLOW ----------
function WarrantyRegistrationFlow({
  lead,
  dealer,
  onComplete,
  onCancel,
}: {
  lead: Lead;
  dealer: Dealer;
  onComplete: (warranty: NonNullable<Lead["warranty"]>) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Step 1 — Classification
  const [warrantyType, setWarrantyType] = useState<"residential" | "commercial">(suggestWarrantyType(lead));
  const [systemType, setSystemType] = useState(suggestSystemType(lead));

  // Step 2 — Installation details
  const today = new Date().toISOString().split("T")[0];
  const [installationDate, setInstallationDate] = useState(today);
  const [ownerName, setOwnerName] = useState(lead.customer);
  const [ownerAddress, setOwnerAddress] = useState(lead.address);
  const [buildingAddress, setBuildingAddress] = useState("");
  const [nearOcean, setNearOcean] = useState(false);

  // Step 3 — Workmanship
  const [workmanshipYears, setWorkmanshipYears] = useState(2);

  // Step 4 — Photos & Attestation
  const [photosUploaded, setPhotosUploaded] = useState(0);
  const [attestation, setAttestation] = useState(false);
  const [signature, setSignature] = useState(dealer.name);

  function handleSubmit() {
    const warranty = {
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
    };
    onComplete(warranty);
  }

  // Calculate finish warranty based on type + ocean proximity
  function getFinishWarrantyYears(): number {
    if (warrantyType === "residential") {
      return nearOcean ? 5 : 10;
    } else {
      return nearOcean ? 1 : 5;
    }
  }

  const isInfinity = systemType === "Infinity Topless Glass";

  // Validation per step
  function canAdvance(): boolean {
    if (step === 1) return !!warrantyType && !!systemType;
    if (step === 2) return !!installationDate && !!ownerName.trim() && !!ownerAddress.trim();
    if (step === 3) return workmanshipYears > 0 && workmanshipYears <= 25;
    if (step === 4) return attestation && !!signature.trim();
    return false;
  }

  return (
    <div className="fixed inset-0 z-[60] bg-ink/80 flex items-start justify-center overflow-y-auto p-4 md:p-8">
      <div className="bg-cream w-full max-w-2xl my-8 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-cream border-b border-stone-200 px-6 md:px-8 py-5 flex items-center justify-between z-10">
          <div>
            <p className="eyebrow text-gold mb-1">Warranty Registration</p>
            <h3 className="font-heading text-xl font-bold">Step {step} of {totalSteps}</h3>
          </div>
          <button onClick={onCancel} className="text-stone-500 hover:text-ink text-2xl leading-none" aria-label="Close">×</button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-stone-200">
          <div className="h-full bg-gold transition-all duration-500" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
        </div>

        <div className="px-6 md:px-8 py-6">
          {/* STEP 1 — Classification */}
          {step === 1 && (
            <div>
              <p className="eyebrow text-stone-500 mb-2">Project Classification</p>
              <h2 className="font-heading text-2xl font-bold mb-3">What type of installation is this?</h2>
              <p className="font-body text-sm text-stone-600 mb-6">
                Warranty coverage differs between residential and commercial projects. Review carefully — this determines the finish warranty terms.
              </p>

              <p className="eyebrow text-stone-600 mb-2">Warranty Type</p>
              <div className="space-y-2 mb-6">
                <label className={`flex items-start gap-3 p-4 border cursor-pointer transition-colors ${warrantyType === "residential" ? "border-gold bg-gold/5" : "border-stone-200 bg-white hover:border-stone-400"}`}>
                  <input
                    type="radio"
                    name="warrantyType"
                    checked={warrantyType === "residential"}
                    onChange={() => setWarrantyType("residential")}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-body font-semibold">Residential</p>
                    <p className="font-body text-xs text-stone-600 mt-1">Single-family detached housing or detached duplex housing.</p>
                    <p className="font-body text-xs text-stone-500 mt-1">20-year structural · 10-year finish (5yr if within 5mi of ocean)</p>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-4 border cursor-pointer transition-colors ${warrantyType === "commercial" ? "border-gold bg-gold/5" : "border-stone-200 bg-white hover:border-stone-400"}`}>
                  <input
                    type="radio"
                    name="warrantyType"
                    checked={warrantyType === "commercial"}
                    onChange={() => setWarrantyType("commercial")}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-body font-semibold">Commercial</p>
                    <p className="font-body text-xs text-stone-600 mt-1">Multi-family (more than duplex): condominiums, townhomes, apartments, and commercial locations.</p>
                    <p className="font-body text-xs text-stone-500 mt-1">20-year structural · 5-year finish (1yr if within 5mi of ocean)</p>
                  </div>
                </label>
              </div>

              <p className="eyebrow text-stone-600 mb-2">System Type</p>
              <select
                value={systemType}
                onChange={(e) => setSystemType(e.target.value)}
                className="w-full border border-stone-300 px-4 py-3 font-body bg-white mb-2"
              >
                <option>Infinity Topless Glass</option>
                <option>Glass Component</option>
                <option>Picket</option>
                <option>Custom</option>
              </select>
              {isInfinity && (
                <p className="font-body text-xs text-gold mt-2">
                  ★ Infinity installation — eligible for premium glass shelf bracket gift.
                </p>
              )}
            </div>
          )}

          {/* STEP 2 — Installation details */}
          {step === 2 && (
            <div>
              <p className="eyebrow text-stone-500 mb-2">Installation Details</p>
              <h2 className="font-heading text-2xl font-bold mb-3">Confirm installation and ownership info</h2>
              <p className="font-body text-sm text-stone-600 mb-6">
                These fields match the official IAS warranty form. The building owner information becomes part of our direct-to-homeowner records.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="eyebrow text-stone-600 block mb-1">Date of Installation</label>
                  <input
                    type="date"
                    value={installationDate}
                    onChange={(e) => setInstallationDate(e.target.value)}
                    className="w-full border border-stone-300 px-4 py-3 font-body bg-white"
                  />
                </div>

                <div>
                  <label className="eyebrow text-stone-600 block mb-1">Building Owner's Name</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Homeowner name"
                    className="w-full border border-stone-300 px-4 py-3 font-body bg-white"
                  />
                </div>

                <div>
                  <label className="eyebrow text-stone-600 block mb-1">Building Owner's Address</label>
                  <input
                    type="text"
                    value={ownerAddress}
                    onChange={(e) => setOwnerAddress(e.target.value)}
                    placeholder="Street, city, province/state, postal code"
                    className="w-full border border-stone-300 px-4 py-3 font-body bg-white"
                  />
                </div>

                <div>
                  <label className="eyebrow text-stone-600 block mb-1">Building Address (if different)</label>
                  <input
                    type="text"
                    value={buildingAddress}
                    onChange={(e) => setBuildingAddress(e.target.value)}
                    placeholder="Leave blank if same as above"
                    className="w-full border border-stone-300 px-4 py-3 font-body bg-white"
                  />
                </div>

                <label className="flex items-start gap-3 p-4 bg-white border border-stone-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nearOcean}
                    onChange={(e) => setNearOcean(e.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-body text-sm font-semibold">Installation is within 5 miles of ocean / saltwater</p>
                    <p className="font-body text-xs text-stone-600 mt-1">
                      Affects finish warranty per IAS terms. Within 5mi of ocean reduces finish coverage to{" "}
                      {warrantyType === "residential" ? "5 years" : "1 year"}.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 3 — Workmanship */}
          {step === 3 && (
            <div>
              <p className="eyebrow text-stone-500 mb-2">Your Workmanship Guarantee</p>
              <h2 className="font-heading text-2xl font-bold mb-3">How long do you guarantee the installation?</h2>
              <p className="font-body text-sm text-stone-600 mb-4">
                Per Section 13 of the IAS warranty, the Installation Company is responsible for workmanship. IAS covers the materials — you cover the install quality. You set the period.
              </p>

              <div className="p-4 bg-gold/5 border-l-4 border-gold mb-6">
                <p className="font-body text-sm text-ink leading-relaxed">
                  <span className="font-semibold">Section 13 (from warranty document):</span> "The Installation Company guarantees that the work has been performed in accordance with the most current standards and specifications set out by the Manufacturer and is responsible for any workmanship related problems for a period of <span className="underline">____ years</span>."
                </p>
              </div>

              <label className="eyebrow text-stone-600 block mb-2">Workmanship Warranty Period</label>
              <div className="flex items-center gap-3 mb-2">
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={workmanshipYears}
                  onChange={(e) => setWorkmanshipYears(parseInt(e.target.value) || 1)}
                  className="w-24 border border-stone-300 px-4 py-3 font-body bg-white text-center text-lg font-bold"
                />
                <span className="font-body text-stone-600">years</span>
              </div>
              <p className="font-body text-xs text-stone-500 mb-6">
                Most dealers guarantee 1–3 years. You can offer additional written warranty terms beyond the IAS form.
              </p>

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

          {/* STEP 4 — Photos & Attestation */}
          {step === 4 && (
            <div>
              <p className="eyebrow text-stone-500 mb-2">Photos & Sign-off</p>
              <h2 className="font-heading text-2xl font-bold mb-3">Upload photos and confirm installation</h2>
              <p className="font-body text-sm text-stone-600 mb-6">
                Installation photos become part of our marketing library (with homeowner consent) and strengthen warranty claims.
              </p>

              <div className="mb-6">
                <label className="eyebrow text-stone-600 block mb-2">Installation Photos (optional, recommended)</label>
                <div className="border-2 border-dashed border-stone-300 bg-white p-6 text-center">
                  <p className="font-body text-sm text-stone-600 mb-3">
                    Upload 1–3 photos of the completed installation.
                  </p>
                  <button
                    onClick={() => setPhotosUploaded(Math.min(3, photosUploaded + 1))}
                    disabled={photosUploaded >= 3}
                    className="btn-outline-dark text-xs px-5 py-2 disabled:opacity-40"
                  >
                    {photosUploaded === 0 ? "Select Photos" : `${photosUploaded} photo${photosUploaded === 1 ? "" : "s"} selected (add more)`}
                  </button>
                  {photosUploaded > 0 && (
                    <div className="flex gap-2 mt-4 justify-center">
                      {Array.from({ length: photosUploaded }).map((_, i) => (
                        <div key={i} className="w-16 h-16 bg-stone-200 border border-stone-300 flex items-center justify-center text-stone-500 text-xs">
                          IMG {i + 1}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6 p-4 bg-stone-100 border border-stone-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attestation}
                    onChange={(e) => setAttestation(e.target.checked)}
                    className="mt-1 flex-shrink-0"
                  />
                  <p className="font-body text-sm text-ink leading-relaxed">
                    <span className="font-semibold">I attest</span> that this installation has been performed in accordance with the most current standards and specifications set out by Innovative Aluminum Systems, Inc. I confirm the information provided is accurate and the Installation Company listed is responsible for workmanship as described.
                  </p>
                </label>
              </div>

              <div>
                <label className="eyebrow text-stone-600 block mb-1">Installation Company Representative Signature</label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Type your full name to sign"
                  className="w-full border border-stone-300 px-4 py-3 font-body bg-white italic"
                  style={{ fontFamily: "cursive" }}
                />
                <p className="font-body text-xs text-stone-500 mt-1">Typed signature of Installation Company Rep (per warranty form)</p>
              </div>
            </div>
          )}

          {/* Step navigation */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-stone-200">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : onCancel()}
              className="text-xs font-body font-bold uppercase tracking-widest px-4 py-2 text-stone-600 hover:text-ink transition-colors"
            >
              {step === 1 ? "Cancel" : "← Back"}
            </button>

            {step < totalSteps ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canAdvance()}
                className="btn-gold text-xs px-6 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canAdvance()}
                className="btn-gold text-xs px-6 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Register Warranty
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- LEAD DETAIL MODAL ----------
function LeadDetailModal({
  lead,
  dealer,
  onClose,
  onUpdate,
}: {
  lead: Lead;
  dealer: Dealer;
  onClose: () => void;
  onUpdate: (updatedLead: Lead) => void;
}) {
  const [actionMode, setActionMode] = useState<"none" | "submit_bid" | "won" | "lost">("none");
  const [showWarrantyFlow, setShowWarrantyFlow] = useState(false);
  const [showWarrantySuccess, setShowWarrantySuccess] = useState(false);

  const [formData, setFormData] = useState({
    scopeOfWork: lead.scopeOfWork || "",
    linealFootage: lead.linealFootage || "",
    projectValue: lead.projectValue || "",
    orderNumber: lead.orderNumber || "",
    lostReason: lead.lostReason || "Price — we were higher",
    wereHigher: lead.wereHigher || "",
    notes: lead.notes || "",
  });

  function handleAccept() {
    onUpdate({ ...lead, status: "accepted", acceptedDate: "Apr 24, 2026" });
  }

  function handleSubmitBid() {
    onUpdate({
      ...lead,
      status: "bid_submitted",
      bidSubmitted: true,
      bidDate: "Apr 24, 2026",
      scopeOfWork: formData.scopeOfWork,
      linealFootage: formData.linealFootage,
      projectValue: formData.projectValue,
    });
    setActionMode("none");
  }

  function handleMarkWon() {
    onUpdate({
      ...lead,
      status: "won",
      closedDate: "Apr 24, 2026",
      orderNumber: formData.orderNumber,
      scopeOfWork: formData.scopeOfWork || lead.scopeOfWork,
      linealFootage: formData.linealFootage || lead.linealFootage,
      projectValue: formData.projectValue || lead.projectValue,
      notes: formData.notes,
    });
    setActionMode("none");
  }

  function handleMarkLost() {
    onUpdate({
      ...lead,
      status: "lost",
      closedDate: "Apr 24, 2026",
      lostReason: formData.lostReason,
      wereHigher: formData.wereHigher,
      notes: formData.notes,
    });
    setActionMode("none");
  }

  function handleWarrantyComplete(warranty: NonNullable<Lead["warranty"]>) {
    onUpdate({
      ...lead,
      completed: true,
      warrantyRegistered: true,
      warranty,
    });
    setShowWarrantyFlow(false);
    setShowWarrantySuccess(true);
  }

  const statusConfig = STATUS_CONFIG[lead.status];
  const overdue = isOverdue(lead);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-ink/70 flex items-start justify-center overflow-y-auto p-4 md:p-8">
        <div className="bg-cream w-full max-w-3xl my-8 shadow-2xl">
          <div className="sticky top-0 bg-cream border-b border-stone-200 px-6 md:px-8 py-5 flex items-center justify-between z-10">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="eyebrow text-stone-500">Lead Detail</p>
              <span className={`text-xs uppercase tracking-wider px-3 py-1 font-bold ${statusConfig.bg} ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
              {overdue && (
                <span className="text-xs uppercase tracking-wider px-3 py-1 font-bold bg-red-600 text-white">Overdue</span>
              )}
            </div>
            <button onClick={onClose} className="text-stone-500 hover:text-ink text-2xl leading-none">×</button>
          </div>

          <div className="px-6 md:px-8 py-6">
            <div className="mb-6">
              <h2 className="font-heading text-3xl font-bold mb-1">{lead.customer}</h2>
              <p className="font-body text-stone-600">{lead.address}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-stone-200">
              <div>
                <p className="eyebrow text-stone-500 mb-2">Contact</p>
                <p className="font-body text-sm">{lead.email}</p>
                <p className="font-body text-sm">{lead.phone}</p>
              </div>
              <div>
                <p className="eyebrow text-stone-500 mb-2">Received</p>
                <p className="font-body text-sm">{lead.receivedDate}</p>
                <p className="font-body text-xs text-stone-500">{getDaysAgo(lead.receivedDate)} days ago</p>
              </div>
            </div>

            <div className="mb-6 pb-6 border-b border-stone-200">
              <p className="eyebrow text-stone-500 mb-2">Project</p>
              <p className="font-body font-semibold mb-1">{lead.projectType}</p>
              <p className="font-body text-sm text-stone-600 mb-3">{lead.estimatedSize}</p>
              <p className="font-body text-sm text-stone-600 leading-relaxed">{lead.description}</p>
            </div>

            <div className="mb-6 pb-6 border-b border-stone-200">
              <p className="eyebrow text-stone-500 mb-3">Timeline</p>
              <div className="space-y-2 text-sm font-body">
                <div className="flex justify-between"><span className="text-stone-600">Received from IAS</span><span className="font-semibold">{lead.receivedDate}</span></div>
                {lead.acceptedDate && <div className="flex justify-between"><span className="text-stone-600">Accepted</span><span className="font-semibold">{lead.acceptedDate}</span></div>}
                {lead.bidDate && <div className="flex justify-between"><span className="text-stone-600">Bid submitted</span><span className="font-semibold">{lead.bidDate}</span></div>}
                {lead.closedDate && <div className="flex justify-between"><span className="text-stone-600">Closed ({lead.status})</span><span className="font-semibold">{lead.closedDate}</span></div>}
                {lead.warranty && <div className="flex justify-between"><span className="text-stone-600">Warranty registered</span><span className="font-semibold text-gold">{lead.warranty.registeredDate}</span></div>}
              </div>
            </div>

            {(lead.scopeOfWork || lead.projectValue || lead.lostReason) && (
              <div className="mb-6 pb-6 border-b border-stone-200">
                <p className="eyebrow text-stone-500 mb-3">Outcome Details</p>
                <div className="space-y-2 text-sm font-body">
                  {lead.scopeOfWork && <div><span className="text-stone-600">Scope of work: </span><span className="font-semibold">{lead.scopeOfWork}</span></div>}
                  {lead.linealFootage && <div><span className="text-stone-600">Lineal footage: </span><span className="font-semibold">{lead.linealFootage} LF</span></div>}
                  {lead.projectValue && <div><span className="text-stone-600">Project value: </span><span className="font-semibold">${parseInt(lead.projectValue).toLocaleString()}</span></div>}
                  {lead.orderNumber && <div><span className="text-stone-600">Order #: </span><span className="font-semibold">{lead.orderNumber}</span></div>}
                  {lead.lostReason && <div><span className="text-stone-600">Reason lost: </span><span className="font-semibold">{lead.lostReason}</span></div>}
                  {lead.wereHigher && <div><span className="text-stone-600">Notes: </span><span className="font-semibold">{lead.wereHigher}</span></div>}
                </div>
              </div>
            )}

            {/* Warranty details if registered */}
            {lead.warranty && (
              <div className="mb-6 pb-6 border-b border-stone-200">
                <p className="eyebrow text-gold mb-3">Warranty — Registered</p>
                <div className="bg-gold/5 border-l-4 border-gold p-5">
                  <div className="space-y-2 text-sm font-body">
                    <div className="flex justify-between"><span className="text-stone-600">Type</span><span className="font-semibold capitalize">{lead.warranty.type}</span></div>
                    <div className="flex justify-between"><span className="text-stone-600">System</span><span className="font-semibold">{lead.warranty.systemType}</span></div>
                    <div className="flex justify-between"><span className="text-stone-600">Installed</span><span className="font-semibold">{lead.warranty.installationDate}</span></div>
                    <div className="flex justify-between"><span className="text-stone-600">IAS Structural</span><span className="font-semibold">20 years</span></div>
                    <div className="flex justify-between"><span className="text-stone-600">IAS Finish</span><span className="font-semibold">
                      {lead.warranty.type === "residential" ? (lead.warranty.nearOcean ? "5" : "10") : (lead.warranty.nearOcean ? "1" : "5")} years
                    </span></div>
                    <div className="flex justify-between"><span className="text-stone-600">Your Workmanship</span><span className="font-semibold">{lead.warranty.workmanshipYears} years</span></div>
                    <div className="flex justify-between"><span className="text-stone-600">Signed by</span><span className="font-semibold italic">{lead.warranty.signature}</span></div>
                    <div className="flex justify-between"><span className="text-stone-600">Photos</span><span className="font-semibold">{lead.warranty.photosUploaded}</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* Warranty registration prompt for WON, not-yet-registered */}
            {lead.status === "won" && !lead.warrantyRegistered && actionMode === "none" && (
              <div className="mb-6 p-5 bg-gold/15 border-l-4 border-gold">
                <p className="eyebrow text-gold mb-2">Phase 3 · Lifecycle Value</p>
                <h4 className="font-heading text-lg font-bold mb-2">Project complete? Register the warranty.</h4>
                <p className="font-body text-sm text-stone-700 mb-3">
                  Digital version of the official IAS warranty form. Completes the closed loop — the homeowner receives their $50 Starbucks gift card and joins our maintenance reminder system. {suggestSystemType(lead) === "Infinity Topless Glass" && "Infinity installations also qualify for a premium glass shelf bracket gift."}
                </p>
                <button onClick={() => setShowWarrantyFlow(true)} className="btn-gold text-xs px-5 py-2.5">
                  Start Warranty Registration →
                </button>
              </div>
            )}

            {actionMode === "submit_bid" && (
              <div className="mb-6 p-5 bg-cream-dark">
                <h4 className="font-heading text-lg font-bold mb-4">Submit Bid</h4>
                <div className="space-y-4">
                  <div>
                    <label className="eyebrow text-stone-600 block mb-1">Scope of Work</label>
                    <textarea value={formData.scopeOfWork} onChange={(e) => setFormData({ ...formData, scopeOfWork: e.target.value })} placeholder="e.g., 80 LF Infinity Topless Glass with Black frame, fascia mount" className="w-full border border-stone-300 px-3 py-2 text-sm font-body bg-white" rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="eyebrow text-stone-600 block mb-1">Lineal Footage</label>
                      <input type="text" value={formData.linealFootage} onChange={(e) => setFormData({ ...formData, linealFootage: e.target.value })} placeholder="80" className="w-full border border-stone-300 px-3 py-2 text-sm font-body bg-white" />
                    </div>
                    <div>
                      <label className="eyebrow text-stone-600 block mb-1">Quote Amount ($)</label>
                      <input type="text" value={formData.projectValue} onChange={(e) => setFormData({ ...formData, projectValue: e.target.value })} placeholder="12500" className="w-full border border-stone-300 px-3 py-2 text-sm font-body bg-white" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleSubmitBid} className="btn-gold text-xs px-5 py-2">Save Bid</button>
                    <button onClick={() => setActionMode("none")} className="btn-outline-dark text-xs px-5 py-2">Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {actionMode === "won" && (
              <div className="mb-6 p-5 bg-cream-dark">
                <h4 className="font-heading text-lg font-bold mb-4">Mark as Won</h4>
                <p className="font-body text-sm text-stone-600 mb-4">Confirm project details. This data helps IAS track performance and identify high-value builders.</p>
                <div className="space-y-4">
                  <div>
                    <label className="eyebrow text-stone-600 block mb-1">Final Scope of Work</label>
                    <textarea value={formData.scopeOfWork} onChange={(e) => setFormData({ ...formData, scopeOfWork: e.target.value })} className="w-full border border-stone-300 px-3 py-2 text-sm font-body bg-white" rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="eyebrow text-stone-600 block mb-1">Lineal Footage</label>
                      <input type="text" value={formData.linealFootage} onChange={(e) => setFormData({ ...formData, linealFootage: e.target.value })} className="w-full border border-stone-300 px-3 py-2 text-sm font-body bg-white" />
                    </div>
                    <div>
                      <label className="eyebrow text-stone-600 block mb-1">Final Project Value ($)</label>
                      <input type="text" value={formData.projectValue} onChange={(e) => setFormData({ ...formData, projectValue: e.target.value })} className="w-full border border-stone-300 px-3 py-2 text-sm font-body bg-white" />
                    </div>
                  </div>
                  <div>
                    <label className="eyebrow text-stone-600 block mb-1">IAS Order Number</label>
                    <input type="text" value={formData.orderNumber} onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })} placeholder="e.g., ORD-2026-0424" className="w-full border border-stone-300 px-3 py-2 text-sm font-body bg-white" />
                  </div>
                  <div>
                    <label className="eyebrow text-stone-600 block mb-1">Notes (optional)</label>
                    <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full border border-stone-300 px-3 py-2 text-sm font-body bg-white" rows={2} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleMarkWon} className="btn-gold text-xs px-5 py-2">Confirm Won</button>
                    <button onClick={() => setActionMode("none")} className="btn-outline-dark text-xs px-5 py-2">Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {actionMode === "lost" && (
              <div className="mb-6 p-5 bg-cream-dark">
                <h4 className="font-heading text-lg font-bold mb-4">Mark as Lost</h4>
                <p className="font-body text-sm text-stone-600 mb-4">Help IAS understand why so we can improve our offering.</p>
                <div className="space-y-4">
                  <div>
                    <label className="eyebrow text-stone-600 block mb-1">Reason</label>
                    <select value={formData.lostReason} onChange={(e) => setFormData({ ...formData, lostReason: e.target.value })} className="w-full border border-stone-300 px-3 py-2 text-sm font-body bg-white">
                      <option>Price — we were higher</option>
                      <option>Timing — couldn't meet deadline</option>
                      <option>Customer went with another dealer</option>
                      <option>Customer chose different material/system</option>
                      <option>Customer didn't proceed with project</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="eyebrow text-stone-600 block mb-1">Notes (optional)</label>
                    <textarea value={formData.wereHigher} onChange={(e) => setFormData({ ...formData, wereHigher: e.target.value })} placeholder="e.g., We bid $14k, they accepted a $12k bid from competitor" className="w-full border border-stone-300 px-3 py-2 text-sm font-body bg-white" rows={2} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleMarkLost} className="btn-gold text-xs px-5 py-2">Confirm Lost</button>
                    <button onClick={() => setActionMode("none")} className="btn-outline-dark text-xs px-5 py-2">Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {actionMode === "none" && (
              <div className="flex flex-wrap gap-2">
                {lead.status === "new" && (
                  <>
                    <button onClick={handleAccept} className="btn-gold text-xs px-5 py-2.5">Accept Lead</button>
                    <button onClick={() => setActionMode("lost")} className="btn-outline-dark text-xs px-5 py-2.5">Decline / Lost</button>
                  </>
                )}
                {lead.status === "accepted" && (
                  <>
                    <button onClick={() => setActionMode("submit_bid")} className="btn-gold text-xs px-5 py-2.5">Submit Bid</button>
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

      {/* Warranty registration flow modal */}
      {showWarrantyFlow && (
        <WarrantyRegistrationFlow
          lead={lead}
          dealer={dealer}
          onComplete={handleWarrantyComplete}
          onCancel={() => setShowWarrantyFlow(false)}
        />
      )}

      {/* Warranty success modal */}
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
              <p className="font-body text-stone-600 mb-6 leading-relaxed">
                {lead.warranty.ownerName}'s warranty has been recorded in the IAS direct-to-homeowner database.
              </p>
            </div>
            <div className="bg-cream-dark px-8 py-6 border-t border-stone-200">
              <p className="eyebrow text-stone-600 mb-4">What happens next</p>
              <div className="space-y-3 text-sm font-body">
                <div className="flex gap-3 items-start">
                  <span className="text-gold font-bold">✓</span>
                  <span>Homeowner receives welcome email + <strong>$50 Starbucks gift card</strong></span>
                </div>
                {lead.warranty.systemType === "Infinity Topless Glass" && (
                  <div className="flex gap-3 items-start">
                    <span className="text-gold font-bold">✓</span>
                    <span>Premium <strong>glass shelf bracket gift</strong> scheduled for shipment (Infinity job)</span>
                  </div>
                )}
                <div className="flex gap-3 items-start">
                  <span className="text-gold font-bold">✓</span>
                  <span>Added to 3-month maintenance reminder system</span>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-gold font-bold">✓</span>
                  <span>Long-term remarketing enabled (years 1–5+)</span>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-gold font-bold">✓</span>
                  <span>Your workmanship warranty ({lead.warranty.workmanshipYears} years) recorded on file</span>
                </div>
                {lead.warranty.photosUploaded > 0 && (
                  <div className="flex gap-3 items-start">
                    <span className="text-gold font-bold">✓</span>
                    <span>{lead.warranty.photosUploaded} installation photo{lead.warranty.photosUploaded === 1 ? "" : "s"} added to marketing library</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 text-center">
              <button onClick={() => setShowWarrantySuccess(false)} className="btn-gold text-xs px-8 py-3">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function LeadsPage() {
  const router = useRouter();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "closed">("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("ias_dealer") : null;
    if (!stored) { router.push("/dealers/login"); return; }
    let parsedDealer: Dealer;
    try {
      parsedDealer = JSON.parse(stored);
      setDealer(parsedDealer);
    } catch { router.push("/dealers/login"); return; }

    const leadsKey = `ias_leads_${parsedDealer.email}`;
    const storedLeads = localStorage.getItem(leadsKey);
    if (storedLeads) {
      try { setLeads(JSON.parse(storedLeads)); } catch { setLeads(SAMPLE_LEADS); }
    } else {
      setLeads(SAMPLE_LEADS);
    }
    setLoading(false);
  }, [router]);

  function persistLeads(updatedLeads: Lead[]) {
    if (!dealer) return;
    setLeads(updatedLeads);
    localStorage.setItem(`ias_leads_${dealer.email}`, JSON.stringify(updatedLeads));
  }

  function handleUpdateLead(updatedLead: Lead) {
    const newLeads = leads.map((l) => (l.id === updatedLead.id ? updatedLead : l));
    persistLeads(newLeads);
    setSelectedLead(updatedLead);
  }

  function resetLeads() {
    if (confirm("Reset leads to demo state? This is for demo purposes.")) {
      persistLeads(SAMPLE_LEADS);
      setSelectedLead(null);
    }
  }

  if (loading || !dealer) {
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
            <Link href="/dealers/dashboard" className="text-sm font-body text-stone-600 hover:text-ink transition-colors">← Dashboard</Link>
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
            Customer leads sent to you from IAS. Respond within 2 business days to maintain your authorized status. Capture outcomes so we can support you with stalled bids and high-value builder relationships.
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
            <p className="text-xs text-stone-500 font-body mt-1">This year</p>
          </div>
          <div className="bg-white border border-stone-200 p-5">
            <p className="eyebrow text-stone-500 mb-2">Total Value Won</p>
            <p className="text-3xl font-heading font-bold">
              ${leads.filter((l) => l.status === "won").reduce((sum, l) => sum + (parseInt(l.projectValue || "0")), 0).toLocaleString()}
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
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-5 py-3 text-xs font-body font-bold uppercase tracking-widest border-b-2 transition-colors ${activeFilter === tab.id ? "border-gold text-ink" : "border-transparent text-stone-500 hover:text-ink"}`}
            >
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
              return (
                <button key={lead.id} onClick={() => setSelectedLead(lead)} className="w-full text-left bg-white border border-stone-200 hover:border-gold hover:shadow-md transition-all p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-xs uppercase tracking-wider px-2.5 py-0.5 font-bold ${statusConfig.bg} ${statusConfig.color}`}>{statusConfig.label}</span>
                        {overdue && <span className="text-xs uppercase tracking-wider px-2.5 py-0.5 font-bold bg-red-600 text-white">Overdue</span>}
                        {lead.status === "won" && !lead.warrantyRegistered && <span className="text-xs uppercase tracking-wider px-2.5 py-0.5 font-bold bg-gold/20 text-gold border border-gold">Register Warranty</span>}
                        {lead.warrantyRegistered && <span className="text-xs uppercase tracking-wider px-2.5 py-0.5 font-bold bg-green-100 text-green-900">Warranty ✓</span>}
                      </div>
                      <h3 className="font-heading text-lg font-bold mb-1">{lead.customer}</h3>
                      <p className="font-body text-sm text-stone-600 mb-1">{lead.projectType}</p>
                      <p className="font-body text-xs text-stone-500">{lead.estimatedSize} · {lead.address.split(",").slice(-2).join(",").trim()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs font-body text-stone-500 uppercase tracking-wider">Received</p>
                        <p className="text-sm font-body font-semibold">{lead.receivedDate}</p>
                        {lead.projectValue && <p className="text-xs font-body text-stone-500 mt-1">${parseInt(lead.projectValue).toLocaleString()}</p>}
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
            When you mark a project as Won and register the warranty, the homeowner receives a $50 Starbucks gift card and is added to our maintenance reminder system. Three-month maintenance touchpoints keep the brand top-of-mind, and warranty data fuels long-term remarketing for upgrades, replacements, and new projects.
          </p>
        </div>

        <div className="text-right">
          <button onClick={resetLeads} className="text-xs font-body uppercase tracking-wider text-stone-400 hover:text-gold transition-colors">
            Reset Leads (Demo)
          </button>
        </div>
      </div>

      {selectedLead && dealer && (
        <LeadDetailModal
          lead={selectedLead}
          dealer={dealer}
          onClose={() => setSelectedLead(null)}
          onUpdate={handleUpdateLead}
        />
      )}
    </div>
  );
}
