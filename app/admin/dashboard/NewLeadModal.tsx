"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Dealer = {
  dealer_id: string;
  company_name: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  dealers: Dealer[];
};

export default function NewLeadModal({ open, onClose, onCreated, dealers }: Props) {
  const [dealerId, setDealerId] = useState("");
  const [customerType, setCustomerType] = useState<"" | "homeowner" | "builder">("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  function reset() {
    setDealerId("");
    setCustomerType("");
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setCity("");
    setProvince("");
    setNotes("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!dealerId) { setError("Please assign to a dealer."); return; }

    setSubmitting(true);

    const { error: insertError } = await supabase.from("leads").insert({
      dealer_id: dealerId,
      customer_type: customerType || null,
      homeowner_name: contactName.trim() || null,
      homeowner_phone: contactPhone.trim() || null,
      homeowner_email: contactEmail.trim() || null,
      city: city.trim() || null,
      province: province.trim() || null,
      notes: notes.trim() || null,
      stage: "new",
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    reset();
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-stone-900 border border-stone-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-stone-800 flex items-center justify-between">
          <div>
            <p className="eyebrow text-gold mb-1">New Lead</p>
            <h2 className="font-heading text-xl font-bold text-cream">Forward to Dealer</h2>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-cream text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Assign to Dealer */}
          <div>
            <label className="block eyebrow text-stone-400 mb-1">Assign to Dealer</label>
            <select
              value={dealerId}
              onChange={(e) => setDealerId(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body"
            >
              <option value="">Select a dealer…</option>
              {dealers.map((d) => (
                <option key={d.dealer_id} value={d.dealer_id}>{d.company_name}</option>
              ))}
            </select>
          </div>

          {/* Customer Type */}
          <div>
            <label className="block eyebrow text-stone-400 mb-1">Customer Type</label>
            <select
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value as "" | "homeowner" | "builder")}
              className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body"
            >
              <option value="">—</option>
              <option value="homeowner">Homeowner</option>
              <option value="builder">Builder</option>
            </select>
          </div>

          {/* Contact info */}
          <div>
            <label className="block eyebrow text-stone-400 mb-1">Contact Name</label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block eyebrow text-stone-400 mb-1">Contact Number</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body"
              />
            </div>
            <div>
              <label className="block eyebrow text-stone-400 mb-1">Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block eyebrow text-stone-400 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body"
              />
            </div>
            <div>
              <label className="block eyebrow text-stone-400 mb-1">Province / State</label>
              <input
                type="text"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block eyebrow text-stone-400 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Any additional info to pass along to the dealer (project size, timeline, special requirements, source of the lead, etc.)"
              className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body"
            />
          </div>

          {error && <p className="text-red-400 text-sm font-body">{error}</p>}

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-800">
            <button type="button" onClick={onClose} className="text-xs uppercase tracking-wider px-4 py-2 border border-stone-700 hover:border-gold text-stone-300 hover:text-gold font-body transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="text-xs uppercase tracking-wider px-6 py-2 bg-gold text-ink hover:bg-gold/80 font-body font-bold transition-colors disabled:opacity-50">
              {submitting ? "Creating…" : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
