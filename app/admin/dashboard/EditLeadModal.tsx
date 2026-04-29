"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

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
      setError("");
    }
  }, [lead]);

  if (!open || !lead) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!dealerId) { setError("Please assign to a dealer."); return; }
    setSaving(true);

    const { error: updateError } = await supabase
      .from("leads")
      .update({
        dealer_id: dealerId,
        customer_type: customerType || null,
        homeowner_name: contactName.trim() || null,
        homeowner_phone: contactPhone.trim() || null,
        homeowner_email: contactEmail.trim() || null,
        city: city.trim() || null,
        province: province.trim() || null,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lead!.id);

    setSaving(false);
    if (updateError) { setError(updateError.message); return; }
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
    if (deleteError) { setError(deleteError.message); return; }
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-stone-900 border border-stone-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-stone-800 flex items-center justify-between">
          <div>
            <p className="eyebrow text-gold mb-1">Edit Lead</p>
            <h2 className="font-heading text-xl font-bold text-cream">Update or Delete</h2>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-cream text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
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
            <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body" />
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
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body" />
          </div>

          {error && <p className="text-red-400 text-sm font-body">{error}</p>}

          <div className="flex justify-between items-center gap-3 pt-4 border-t border-stone-800">
            <button type="button" onClick={handleDelete} disabled={saving || deleting} className="text-xs uppercase tracking-wider px-4 py-2 border border-red-500 text-red-400 hover:bg-red-950 font-body transition-colors disabled:opacity-50">
              {deleting ? "Deleting…" : "Delete Lead"}
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} disabled={saving || deleting} className="text-xs uppercase tracking-wider px-4 py-2 border border-stone-700 hover:border-gold text-stone-300 hover:text-gold font-body transition-colors">
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
