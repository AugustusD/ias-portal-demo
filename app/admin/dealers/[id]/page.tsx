"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Dealer = {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  joined_date: string | null;
  onboarding_stage: string;
  authorized: boolean;
  street_address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  years_in_business: number | null;
  website: string | null;
  notes: string | null;
  type_of_business: string[] | null;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  engineer_relationship: boolean | null;
  newsletter_opt_in: boolean | null;
  signature_data: string | null;
  signature_name: string | null;
  signature_title: string | null;
  signature_signed_at: string | null;
  registered_business_number: string | null;
  contractor_license_number: string | null;
  regions_sold_to: string | null;
  infinity_discount_pct: number | null;
  glass_component_discount_pct: number | null;
  picket_discount_pct: number | null;
  custom_discount_pct: number | null;
  discount_notes: string | null;
  discount_set_at: string | null;
  discount_set_by: string | null;
};

type TeamMember = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
  modules_complete: number;
};

type LeadRow = {
  id: string;
  homeowner_name: string | null;
  product_interest: string | null;
  customer_type: string | null;
  city: string | null;
  province: string | null;
  stage: string;
  project_value: number | null;
  received_at: string;
  closed_at: string | null;
};

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

const STAGE_LABELS: Record<string, string> = {
  new: "New",
  forms_pending: "Forms Pending",
  training: "Training",
  authorized: "Authorized",
  inactive: "Inactive",
};

const LEAD_STAGE_LABELS: Record<string, string> = {
  new: "New",
  accepted: "Accepted",
  bid_submitted: "Bid Submitted",
  won: "Won",
  lost: "Lost",
};

function formatDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function timeAgo(s: string | null): string {
  if (!s) return "—";
  const ms = Date.now() - new Date(s).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

const DISCOUNT_FIELDS: (keyof Dealer)[] = [
  "infinity_discount_pct",
  "glass_component_discount_pct",
  "picket_discount_pct",
  "custom_discount_pct",
  "discount_notes",
];

export default function DealerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const dealerId = params?.id as string;

  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [adminName, setAdminName] = useState("Admin");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Dealer>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/admin/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", session.user.id)
        .single();

      if (!profile || profile.role !== "admin") { router.push("/admin/login"); return; }
      setAdminName(profile.full_name || "Admin");

      const { data: dealerData, error: dealerErr } = await supabase
        .from("dealers")
        .select("*")
        .eq("id", dealerId)
        .single();

      if (dealerErr || !dealerData) {
        setError("Dealer not found.");
        setLoading(false);
        return;
      }
      setDealer(dealerData as Dealer);
      setFormData(dealerData as Dealer);

      const { data: teamData } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, created_at")
        .eq("dealer_id", dealerId)
        .order("created_at", { ascending: true });

      if (teamData) {
        const teamWithProgress: TeamMember[] = [];
        for (const member of teamData) {
          const { count } = await supabase
            .from("training_progress")
            .select("*", { count: "exact", head: true })
            .eq("user_id", member.id);
          teamWithProgress.push({ ...member, modules_complete: count ?? 0 });
        }
        setTeam(teamWithProgress);
      }

      const { data: leadsData } = await supabase
        .from("leads")
        .select("id, homeowner_name, product_interest, customer_type, city, province, stage, project_value, received_at, closed_at")
        .eq("dealer_id", dealerId)
        .order("received_at", { ascending: false });

      setLeads((leadsData as LeadRow[]) || []);
      setLoading(false);
    }
    load();
  }, [dealerId, router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  function handleEdit() {
    if (dealer) setFormData(dealer);
    setIsEditing(true);
    setSaveError("");
  }

  function handleCancel() {
    if (dealer) setFormData(dealer);
    setIsEditing(false);
    setSaveError("");
  }

  async function handleSave() {
    if (!dealer) return;
    setSaving(true);
    setSaveError("");

    const discountChanged = DISCOUNT_FIELDS.some((f) => formData[f] !== dealer[f]);

    const updates: Partial<Dealer> = { ...formData };
    delete updates.id;
    delete updates.joined_date;
    delete updates.signature_data;
    delete updates.signature_name;
    delete updates.signature_title;
    delete updates.signature_signed_at;

    if (discountChanged) {
      updates.discount_set_at = new Date().toISOString();
      updates.discount_set_by = adminName;
    }

    const { error: updateError } = await supabase
      .from("dealers")
      .update(updates)
      .eq("id", dealerId);

    setSaving(false);

    if (updateError) {
      setSaveError(updateError.message);
      return;
    }

    setDealer({ ...dealer, ...updates } as Dealer);
    setIsEditing(false);
  }

  function setField<K extends keyof Dealer>(key: K, value: Dealer[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function toggleBusinessType(type: string) {
    const current = formData.type_of_business || [];
    if (current.includes(type)) setField("type_of_business", current.filter((t) => t !== type));
    else setField("type_of_business", [...current, type]);
  }

  if (loading) {
    return <div className="bg-ink min-h-screen text-cream"><div className="section-container section-padding"><p className="text-stone-400">Loading...</p></div></div>;
  }

  if (error || !dealer) {
    return (
      <div className="bg-ink min-h-screen text-cream">
        <div className="section-container section-padding">
          <p className="text-stone-400 mb-4">{error || "Dealer not found."}</p>
          <Link href="/admin/dashboard" className="text-xs uppercase tracking-wider px-5 py-2.5 bg-gold text-ink hover:bg-gold/80 font-body font-bold transition-colors">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const wonLeads = leads.filter((l) => l.stage === "won");
  const activeLeads = leads.filter((l) => ["new", "accepted", "bid_submitted"].includes(l.stage));
  const totalWonValue = wonLeads.reduce((s, l) => s + (l.project_value || 0), 0);
  const fullAddress = [dealer.street_address, dealer.city, dealer.province, dealer.postal_code].filter(Boolean).join(", ");

  // Tailwind input styles
  const inputCls = "w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body text-sm";
  const labelCls = "text-xs uppercase tracking-wider text-stone-500 mb-1 block";

  return (
    <div className="bg-ink min-h-screen text-cream">
      <div className="border-b border-stone-800 bg-ink sticky top-0 z-20">
        <div className="section-container py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard" className="text-sm font-body text-stone-400 hover:text-cream">← Dealers</Link>
            <span className="text-stone-700">/</span>
            <p className="eyebrow text-stone-400">{dealer.company_name}</p>
          </div>
          <div className="flex items-center gap-4">
            {isEditing ? (
              <>
                <button onClick={handleCancel} disabled={saving} className="text-xs font-body uppercase tracking-wider border border-stone-700 hover:border-cream px-4 py-2 transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="text-xs uppercase tracking-wider px-5 py-2.5 bg-gold text-ink hover:bg-gold/80 font-body font-bold transition-colors disabled:opacity-50">
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </>
            ) : (
              <button onClick={handleEdit} className="text-xs uppercase tracking-wider px-5 py-2.5 bg-gold text-ink hover:bg-gold/80 font-body font-bold transition-colors">Edit Dealer</button>
            )}
            <button onClick={handleLogout} className="text-xs font-body uppercase tracking-wider border border-stone-700 hover:border-gold hover:text-gold px-4 py-2 transition-colors">Log Out</button>
          </div>
        </div>
      </div>

      <div className="section-container section-padding">
        {/* Hero */}
        <div className="mb-10">
          <p className="eyebrow text-gold mb-2">Dealer</p>
          <div className="flex items-baseline gap-4 flex-wrap mb-3">
            <h1 className="font-heading text-4xl md:text-5xl font-bold">{dealer.company_name}</h1>
            {isEditing ? (
              <select value={formData.onboarding_stage || ""} onChange={(e) => setField("onboarding_stage", e.target.value)} className="text-xs uppercase tracking-wider px-3 py-1 font-bold bg-stone-800 text-stone-200 border border-stone-600">
                {Object.entries(STAGE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
              </select>
            ) : (
              <span className={`text-xs uppercase tracking-wider px-3 py-1 font-bold ${
                dealer.onboarding_stage === "authorized" ? "bg-green-900 text-green-100" :
                dealer.onboarding_stage === "training" ? "bg-amber-900 text-amber-100" :
                dealer.onboarding_stage === "forms_pending" ? "bg-red-900 text-red-100" :
                "bg-stone-800 text-stone-300"
              }`}>{STAGE_LABELS[dealer.onboarding_stage] || dealer.onboarding_stage}</span>
            )}
          </div>
          <p className="font-body text-stone-400">{dealer.location || "—"} · Joined {formatDate(dealer.joined_date)}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-stone-900 border border-stone-800 p-5"><p className="eyebrow text-stone-500 mb-2">Team</p><p className="text-3xl font-heading font-bold text-cream">{team.length}</p><p className="text-xs text-stone-500 font-body mt-1">{team.length === 1 ? "user" : "users"}</p></div>
          <div className="bg-stone-900 border border-stone-800 p-5"><p className="eyebrow text-stone-500 mb-2">Active Leads</p><p className="text-3xl font-heading font-bold text-cream">{activeLeads.length}</p><p className="text-xs text-stone-500 font-body mt-1">in pipeline</p></div>
          <div className="bg-stone-900 border border-stone-800 p-5"><p className="eyebrow text-stone-500 mb-2">Won</p><p className="text-3xl font-heading font-bold text-cream">{wonLeads.length}</p><p className="text-xs text-stone-500 font-body mt-1">total</p></div>
          <div className="bg-stone-900 border border-stone-800 p-5"><p className="eyebrow text-stone-500 mb-2">Won Value</p><p className="text-3xl font-heading font-bold text-gold">${(totalWonValue / 1000).toFixed(1)}K</p><p className="text-xs text-stone-500 font-body mt-1">all time</p></div>
        </div>

        {/* Discounts & Pricing — NEW */}
        <div className="mb-10 bg-stone-900 border-2 border-gold p-6">
          <div className="flex items-baseline justify-between mb-4">
            <p className="eyebrow text-gold">Discounts &amp; Pricing</p>
            {dealer.discount_set_at && (
              <p className="text-xs font-body text-stone-500">
                Last updated by <span className="text-stone-300">{dealer.discount_set_by || "Admin"}</span> · {formatDate(dealer.discount_set_at)}
              </p>
            )}
          </div>
          <p className="font-body text-sm text-stone-400 mb-5">Per-product discount percentages negotiated for this dealer. Applied automatically when generating quotes.</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className={labelCls}>Infinity Topless</label>
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <input type="number" step="0.01" min="0" max="100" value={formData.infinity_discount_pct ?? ""} onChange={(e) => setField("infinity_discount_pct", e.target.value === "" ? null : parseFloat(e.target.value))} className={inputCls} />
                  <span className="text-stone-400">%</span>
                </div>
              ) : (
                <p className="text-3xl font-heading font-bold text-gold">{dealer.infinity_discount_pct != null ? `${dealer.infinity_discount_pct}%` : "—"}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Glass Component</label>
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <input type="number" step="0.01" min="0" max="100" value={formData.glass_component_discount_pct ?? ""} onChange={(e) => setField("glass_component_discount_pct", e.target.value === "" ? null : parseFloat(e.target.value))} className={inputCls} />
                  <span className="text-stone-400">%</span>
                </div>
              ) : (
                <p className="text-3xl font-heading font-bold text-gold">{dealer.glass_component_discount_pct != null ? `${dealer.glass_component_discount_pct}%` : "—"}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Picket</label>
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <input type="number" step="0.01" min="0" max="100" value={formData.picket_discount_pct ?? ""} onChange={(e) => setField("picket_discount_pct", e.target.value === "" ? null : parseFloat(e.target.value))} className={inputCls} />
                  <span className="text-stone-400">%</span>
                </div>
              ) : (
                <p className="text-3xl font-heading font-bold text-gold">{dealer.picket_discount_pct != null ? `${dealer.picket_discount_pct}%` : "—"}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Custom</label>
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <input type="number" step="0.01" min="0" max="100" value={formData.custom_discount_pct ?? ""} onChange={(e) => setField("custom_discount_pct", e.target.value === "" ? null : parseFloat(e.target.value))} className={inputCls} />
                  <span className="text-stone-400">%</span>
                </div>
              ) : (
                <p className="text-3xl font-heading font-bold text-gold">{dealer.custom_discount_pct != null ? `${dealer.custom_discount_pct}%` : "—"}</p>
              )}
            </div>
          </div>

          <div>
            <label className={labelCls}>Pricing Notes</label>
            {isEditing ? (
              <textarea value={formData.discount_notes || ""} onChange={(e) => setField("discount_notes", e.target.value)} rows={3} placeholder="Volume commitment, review date, special arrangements…" className={inputCls} />
            ) : (
              <p className="font-body text-sm text-cream whitespace-pre-wrap">{dealer.discount_notes || "—"}</p>
            )}
          </div>
        </div>

        {/* Business Info */}
        <div className="mb-10 bg-stone-900 border border-stone-800 p-6">
          <p className="eyebrow text-gold mb-4">Business Info</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 font-body">
            <div>
              <label className={labelCls}>Primary Contact</label>
              {isEditing ? (<input value={formData.contact_name || ""} onChange={(e) => setField("contact_name", e.target.value)} className={inputCls} />) : (<p className="text-cream">{dealer.contact_name || "—"}</p>)}
            </div>
            <div>
              <label className={labelCls}>Email</label>
              {isEditing ? (<input value={formData.email || ""} onChange={(e) => setField("email", e.target.value)} className={inputCls} />) : (<p className="text-cream break-all">{dealer.email || "—"}</p>)}
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              {isEditing ? (<input value={formData.phone || ""} onChange={(e) => setField("phone", e.target.value)} className={inputCls} />) : (<p className="text-cream">{dealer.phone || "—"}</p>)}
            </div>
            <div>
              <label className={labelCls}>Website</label>
              {isEditing ? (<input value={formData.website || ""} onChange={(e) => setField("website", e.target.value)} className={inputCls} />) : (
                <p className="text-cream break-all">{dealer.website ? <a href={dealer.website} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">{dealer.website}</a> : "—"}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Street Address</label>
              {isEditing ? (<input value={formData.street_address || ""} onChange={(e) => setField("street_address", e.target.value)} className={inputCls} />) : (<p className="text-cream">{dealer.street_address || "—"}</p>)}
            </div>
            <div>
              <label className={labelCls}>City</label>
              {isEditing ? (<input value={formData.city || ""} onChange={(e) => setField("city", e.target.value)} className={inputCls} />) : (<p className="text-cream">{dealer.city || "—"}</p>)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Province</label>
                {isEditing ? (<input value={formData.province || ""} onChange={(e) => setField("province", e.target.value)} className={inputCls} />) : (<p className="text-cream">{dealer.province || "—"}</p>)}
              </div>
              <div>
                <label className={labelCls}>Postal</label>
                {isEditing ? (<input value={formData.postal_code || ""} onChange={(e) => setField("postal_code", e.target.value)} className={inputCls} />) : (<p className="text-cream">{dealer.postal_code || "—"}</p>)}
              </div>
            </div>
            <div>
              <label className={labelCls}>Years in Business</label>
              {isEditing ? (<input type="number" value={formData.years_in_business ?? ""} onChange={(e) => setField("years_in_business", e.target.value === "" ? null : parseInt(e.target.value))} className={inputCls} />) : (<p className="text-cream">{dealer.years_in_business ?? "—"}</p>)}
            </div>
            <div>
              <label className={labelCls}>Registered Business #</label>
              {isEditing ? (<input value={formData.registered_business_number || ""} onChange={(e) => setField("registered_business_number", e.target.value)} className={inputCls} />) : (<p className="text-cream">{dealer.registered_business_number || "—"}</p>)}
            </div>
            <div>
              <label className={labelCls}>Contractor License #</label>
              {isEditing ? (<input value={formData.contractor_license_number || ""} onChange={(e) => setField("contractor_license_number", e.target.value)} className={inputCls} />) : (<p className="text-cream">{dealer.contractor_license_number || "—"}</p>)}
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Geographical Regions Sold To</label>
              {isEditing ? (<input value={formData.regions_sold_to || ""} onChange={(e) => setField("regions_sold_to", e.target.value)} className={inputCls} />) : (<p className="text-cream">{dealer.regions_sold_to || "—"}</p>)}
            </div>
            <div className="md:col-span-2">
              <label className={`${labelCls} mb-2`}>Type of Business</label>
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {BUSINESS_TYPES.map((type) => {
                    const checked = (formData.type_of_business || []).includes(type);
                    return (
                      <label key={type} className={`flex items-center gap-2 p-2 border cursor-pointer text-sm ${checked ? "border-gold bg-gold/10" : "border-stone-700 bg-stone-950 hover:border-stone-500"}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleBusinessType(type)} />
                        <span>{type}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(dealer.type_of_business || []).map((t) => (<span key={t} className="text-xs uppercase tracking-wider px-2.5 py-1 font-bold bg-stone-800 text-stone-200">{t}</span>))}
                  {!dealer.type_of_business?.length && <p className="text-cream">—</p>}
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Additional Notes</label>
              {isEditing ? (<textarea value={formData.notes || ""} onChange={(e) => setField("notes", e.target.value)} rows={3} className={inputCls} />) : (<p className="text-cream whitespace-pre-wrap">{dealer.notes || "—"}</p>)}
            </div>
          </div>
        </div>

        {/* Owner */}
        <div className="mb-10 bg-stone-900 border border-stone-800 p-6">
          <p className="eyebrow text-gold mb-4">Owner</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 font-body">
            <div>
              <label className={labelCls}>Name</label>
              {isEditing ? (<input value={formData.owner_name || ""} onChange={(e) => setField("owner_name", e.target.value)} className={inputCls} />) : (<p className="text-cream">{dealer.owner_name || "—"}</p>)}
            </div>
            <div>
              <label className={labelCls}>Email</label>
              {isEditing ? (<input value={formData.owner_email || ""} onChange={(e) => setField("owner_email", e.target.value)} className={inputCls} />) : (<p className="text-cream break-all">{dealer.owner_email || "—"}</p>)}
            </div>
            <div>
              <label className={labelCls}>Cell</label>
              {isEditing ? (<input value={formData.owner_phone || ""} onChange={(e) => setField("owner_phone", e.target.value)} className={inputCls} />) : (<p className="text-cream">{dealer.owner_phone || "—"}</p>)}
            </div>
          </div>
        </div>

        {/* Compliance */}
        <div className="mb-10 bg-stone-900 border border-stone-800 p-6">
          <p className="eyebrow text-gold mb-4">Compliance &amp; Preferences</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 font-body">
            <div>
              <label className={labelCls}>Working with Qualified Engineer</label>
              {isEditing ? (
                <select value={formData.engineer_relationship === null || formData.engineer_relationship === undefined ? "" : String(formData.engineer_relationship)} onChange={(e) => setField("engineer_relationship", e.target.value === "" ? null : e.target.value === "true")} className={inputCls}>
                  <option value="">—</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              ) : (
                <p className="text-cream">{dealer.engineer_relationship === true ? <span className="text-green-400 font-semibold">✓ Yes</span> : dealer.engineer_relationship === false ? <span className="text-amber-400 font-semibold">✗ No</span> : "—"}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Newsletter Subscription</label>
              <p className="text-cream">{dealer.newsletter_opt_in === true ? <span className="text-green-400 font-semibold">✓ Subscribed</span> : <span className="text-stone-400">Not subscribed</span>}</p>
            </div>
          </div>
        </div>

        {/* Signature — read-only */}
        {(dealer.signature_data || dealer.signature_name) && (
          <div className="mb-10 bg-stone-900 border border-stone-800 p-6">
            <p className="eyebrow text-gold mb-4">Authorized Signature</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-body">
              <div>
                <p className={labelCls}>Signature</p>
                {dealer.signature_data ? (
                  <div className="bg-cream p-3 inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={dealer.signature_data} alt="Authorized signature" className="max-h-32" />
                  </div>
                ) : (<p className="text-stone-400">No signature on file</p>)}
              </div>
              <div className="space-y-3">
                <div><p className={labelCls}>Signed By</p><p className="text-cream">{dealer.signature_name || "—"}</p></div>
                <div><p className={labelCls}>Title</p><p className="text-cream">{dealer.signature_title || "—"}</p></div>
                <div><p className={labelCls}>Date Signed</p><p className="text-cream">{formatDate(dealer.signature_signed_at)}</p></div>
              </div>
            </div>
          </div>
        )}

        {saveError && <p className="text-red-400 font-body mb-6">{saveError}</p>}

        {/* Team */}
        <div className="mb-10 bg-stone-900 border border-stone-800 overflow-hidden">
          <div className="p-6 border-b border-stone-800 flex items-center justify-between">
            <p className="eyebrow text-gold">Team ({team.length})</p>
            <p className="text-xs font-body text-stone-500">Users registered under this dealer</p>
          </div>
          {team.length === 0 ? (
            <div className="p-6 text-center font-body text-stone-500">No team members yet.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-stone-950 text-stone-400">
                <tr className="border-b border-stone-800">
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Name</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Email</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Joined</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Onboarding</th>
                </tr>
              </thead>
              <tbody>
                {team.map((m) => (
                  <tr key={m.id} className="border-b border-stone-800">
                    <td className="py-4 px-4 font-body font-semibold text-cream">{m.full_name || "—"}</td>
                    <td className="py-4 px-4 font-body text-sm text-cream">{m.email || "—"}</td>
                    <td className="py-4 px-4 font-body text-sm text-stone-300">{formatDate(m.created_at)}</td>
                    <td className="py-4 px-4 font-body text-sm"><span className={m.modules_complete === 5 ? "text-green-400" : "text-stone-300"}>{m.modules_complete}/5 modules</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Leads */}
        <div className="bg-stone-900 border border-stone-800 overflow-hidden">
          <div className="p-6 border-b border-stone-800 flex items-center justify-between">
            <p className="eyebrow text-gold">Leads ({leads.length})</p>
            <p className="text-xs font-body text-stone-500">All leads forwarded to this dealer</p>
          </div>
          {leads.length === 0 ? (
            <div className="p-6 text-center font-body text-stone-500">No leads yet.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-stone-950 text-stone-400">
                <tr className="border-b border-stone-800">
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Customer</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Type</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Location</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Stage</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Received</th>
                  <th className="text-right py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Value</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-stone-800">
                    <td className="py-4 px-4">
                      <p className="font-body font-semibold text-cream">{lead.homeowner_name || "—"}</p>
                      {lead.product_interest && <p className="text-xs text-stone-500 font-body">{lead.product_interest}</p>}
                    </td>
                    <td className="py-4 px-4 font-body text-sm text-stone-300 capitalize">{lead.customer_type || "—"}</td>
                    <td className="py-4 px-4 font-body text-sm text-stone-300">{[lead.city, lead.province].filter(Boolean).join(", ") || "—"}</td>
                    <td className="py-4 px-4">
                      <span className={`text-xs uppercase tracking-wider px-2.5 py-0.5 font-bold ${
                        lead.stage === "won" ? "bg-green-900 text-green-100" :
                        lead.stage === "lost" ? "bg-stone-800 text-stone-300" :
                        lead.stage === "new" ? "bg-gold text-ink" :
                        lead.stage === "accepted" ? "bg-blue-900 text-blue-100" :
                        "bg-amber-900 text-amber-100"
                      }`}>{LEAD_STAGE_LABELS[lead.stage] || lead.stage}</span>
                    </td>
                    <td className="py-4 px-4 font-body text-sm text-stone-300">{timeAgo(lead.received_at)}</td>
                    <td className="py-4 px-4 text-right font-heading font-bold text-cream">${(lead.project_value || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
