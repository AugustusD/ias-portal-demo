"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { humanizeError } from "@/lib/errors";

type Dealer = {
  dealer_id: string;
  company_name: string;
};

export type EditLead = {
  id: string;
  dealer_id: string;
  customer_type: "homeowner" | "builder" | null;
  homeowner_name: string | null;
  homeowner_phone: string | null;
  homeowner_email: string | null;
  city: string | null;
  province: string | null;
  notes: string | null;
  // Meeting items (2026-05-04) — also editable post-creation
  project_name: string | null;
  contact_company: string | null;
  bid_due_date: string | null;
};

type Props = {
  open: boolean;
  lead: EditLead | null;
  onClose: () => void;
  onSaved: () => void;
  dealers: Dealer[];
};

export default function EditLeadModal({ open, lead, onClose, onSaved, dealers }: Props) {
  const [dealerId, setDealerId] = useState("");
  const [customerType, setCustomerType] = useState<"" | "homeowner" | "builder">("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [notes, setNotes] = useState("");
  const [projectName, setProjectName] = useState("");
  const [contactCompany, setContactCompany] = useState("");
  const [bidDueDate, setBidDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Dirty-check + confirm-discard. Compares each editable field against the
  // lead prop so the prompt only fires if the admin actually changed
  // something — opening Edit and immediately closing is silent.
  function isDirty(): boolean {
    if (!lead) return false;
    return (
      dealerId !== lead.dealer_id ||
      customerType !== (lead.customer_type || "") ||
      contactName !== (lead.homeowner_name || "") ||
      contactPhone !== (lead.homeowner_phone || "") ||
      contactEmail !== (lead.homeowner_email || "") ||
      city !== (lead.city || "") ||
      province !== (lead.province || "") ||
      notes !== (lead.notes || "") ||
      projectName !== (lead.project_name || "") ||
      contactCompany !== (lead.contact_company || "") ||
      bidDueDate !== (lead.bid_due_date || "")
    );
  }

  function attemptClose() {
    if (saving || deleting) return;
    if (isDirty() && !confirm("Discard your changes?")) return;
    onClose();
  }

  // Escape-to-close routed through attemptClose. closeRef captures the
  // latest dirty-check on each render so the keydown listener doesn't need
  // to re-subscribe on every input change.
  const closeRef = useRef<() => void>(() => {});
  closeRef.current = attemptClose;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (lead) {
      setDealerId(lead.dealer_id);
      setCustomerType(lead.customer_type || "");
      setContactName(lead.homeowner_name || "");
      setContactPhone(lead.homeowner_phone || "");
      setContactEmail(lead.homeowner_email || "");
      setCity(lead.city || "");
      setProvince(lead.province || "");
      setNotes(lead.notes || "");
      setProjectName(lead.project_name || "");
      setContactCompany(lead.contact_company || "");
      setBidDueDate(lead.bid_due_date || "");
      setError("");
    }
  }, [lead]);

  if (!open || !lead) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!dealerId) { setError("Please assign to a dealer."); return; }
    setSaving(true);

    // Only include fields that actually changed since the lead was loaded.
    // Without this diff, a second admin editing the same row in another
    // tab can silently overwrite a field they didn't touch (e.g. fix the
    // city while a parallel save just updated dealer_id — second save
    // reverts dealer_id back to the old loaded value). Same pattern the
    // admin dealer detail page got in round 2.
    const updates: Record<string, string | null> = {};
    if (dealerId !== lead!.dealer_id) updates.dealer_id = dealerId;
    if ((customerType || null) !== (lead!.customer_type ?? null)) updates.customer_type = customerType || null;
    if ((contactName.trim() || null) !== (lead!.homeowner_name ?? null)) updates.homeowner_name = contactName.trim() || null;
    if ((contactPhone.trim() || null) !== (lead!.homeowner_phone ?? null)) updates.homeowner_phone = contactPhone.trim() || null;
    if ((contactEmail.trim() || null) !== (lead!.homeowner_email ?? null)) updates.homeowner_email = contactEmail.trim() || null;
    if ((city.trim() || null) !== (lead!.city ?? null)) updates.city = city.trim() || null;
    if ((province.trim() || null) !== (lead!.province ?? null)) updates.province = province.trim() || null;
    if ((notes.trim() || null) !== (lead!.notes ?? null)) updates.notes = notes.trim() || null;
    if ((projectName.trim() || null) !== (lead!.project_name ?? null)) updates.project_name = projectName.trim() || null;
    if ((contactCompany.trim() || null) !== (lead!.contact_company ?? null)) updates.contact_company = contactCompany.trim() || null;
    if ((bidDueDate || null) !== (lead!.bid_due_date ?? null)) updates.bid_due_date = bidDueDate || null;

    if (Object.keys(updates).length === 0) {
      setSaving(false);
      onClose();
      return;
    }

    const { error: updateError } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", lead!.id);

    setSaving(false);
    if (updateError) { setError(humanizeError(updateError, "Couldn't update lead.")); return; }
    onSaved();
    onClose();
  }

  async function handleDelete() {
    if (!confirm(`Delete lead for "${contactName || "unnamed contact"}"? This cannot be undone.`)) return;
    setDeleting(true);
    const { error: deleteError } = await supabase
      .from("leads")
      .delete()
      .eq("id", lead!.id);
    setDeleting(false);
    if (deleteError) { setError(humanizeError(deleteError, "Couldn't delete lead.")); return; }
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={attemptClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-lead-title"
        className="bg-stone-900 border border-stone-800 max-w-2xl lg:max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-stone-800 flex items-center justify-between">
          <div>
            <p className="eyebrow text-gold mb-1">Edit Lead</p>
            <h2 id="edit-lead-title" className="font-heading text-xl font-bold text-cream">Update or Delete</h2>
          </div>
          <button onClick={attemptClose} aria-label="Close dialog" className="text-stone-500 hover:text-cream text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block eyebrow text-stone-400 mb-1">Project Name</label>
            <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Harbour View Towers, Phase 2" maxLength={200} className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block eyebrow text-stone-400 mb-1">Contracting Company</label>
              <input type="text" value={contactCompany} onChange={(e) => setContactCompany(e.target.value)} maxLength={200} className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body" />
            </div>
            <div>
              <label className="block eyebrow text-stone-400 mb-1">Bid Due Date</label>
              <input type="date" value={bidDueDate} onChange={(e) => setBidDueDate(e.target.value)} className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body" />
            </div>
          </div>

          <div>
            <label className="block eyebrow text-stone-400 mb-1">Assign to Dealer</label>
            <select value={dealerId} onChange={(e) => setDealerId(e.target.value)} className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body">
              <option value="">Select a dealer…</option>
              {dealers.map((d) => (<option key={d.dealer_id} value={d.dealer_id}>{d.company_name}</option>))}
            </select>
          </div>

          <div>
            <label className="block eyebrow text-stone-400 mb-1">Customer Type</label>
            <select value={customerType} onChange={(e) => setCustomerType(e.target.value as "" | "homeowner" | "builder")} className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body">
              <option value="">—</option>
              <option value="homeowner">Homeowner</option>
              <option value="builder">Builder</option>
            </select>
          </div>

          <div>
            <label className="block eyebrow text-stone-400 mb-1">Contact Name</label>
            <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} maxLength={200} className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block eyebrow text-stone-400 mb-1">Contact Number</label>
              <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body" />
            </div>
            <div>
              <label className="block eyebrow text-stone-400 mb-1">Contact Email</label>
              <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block eyebrow text-stone-400 mb-1">City</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body" />
            </div>
            <div>
              <label className="block eyebrow text-stone-400 mb-1">Province / State</label>
              <input type="text" value={province} onChange={(e) => setProvince(e.target.value)} className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body" />
            </div>
          </div>

          <div>
            <label className="block eyebrow text-stone-400 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} maxLength={5000} className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body" />
          </div>

          {error && <p className="text-red-400 text-sm font-body">{error}</p>}

          <div className="flex justify-between items-center gap-3 pt-4 border-t border-stone-800">
            <button type="button" onClick={handleDelete} disabled={saving || deleting} className="text-xs uppercase tracking-wider px-4 py-2 border border-red-500 text-red-400 hover:bg-red-950 font-body transition-colors disabled:opacity-50">
              {deleting ? "Deleting…" : "Delete Lead"}
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={attemptClose} disabled={saving || deleting} className="text-xs uppercase tracking-wider px-4 py-2 border border-stone-700 hover:border-gold text-stone-300 hover:text-gold font-body transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving || deleting} className="text-xs uppercase tracking-wider px-6 py-2 bg-gold text-ink hover:bg-gold/80 font-body font-bold transition-colors disabled:opacity-50">
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
