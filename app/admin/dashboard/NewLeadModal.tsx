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
  const [homeowner, setHomeowner] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [product, setProduct] = useState("");
  const [estValue, setEstValue] = useState("");
  const [linealFt, setLinealFt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!dealerId) { setError("Please select a dealer."); return; }
    if (!homeowner.trim()) { setError("Homeowner name is required."); return; }

    setSubmitting(true);

    const { error: insertError } = await supabase.from("leads").insert({
      dealer_id: dealerId,
      homeowner_name: homeowner.trim(),
      homeowner_email: email.trim() || null,
      homeowner_phone: phone.trim() || null,
      project_address: address.trim() || null,
      product_interest: product.trim() || null,
      project_value: estValue ? parseFloat(estValue) : null,
      lineal_footage: linealFt ? parseFloat(linealFt) : null,
      stage: "new",
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setDealerId(""); setHomeowner(""); setEmail(""); setPhone("");
    setAddress(""); setProduct(""); setEstValue(""); setLinealFt("");
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
          <div>
            <label className="block eyebrow text-stone-400 mb-1">Assign to dealer *</label>
            <select
              value={dealerId}
              onChange={(e) => setDealerId(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body"
              required
            >
              <option value="">Select a dealer…</option>
              {dealers.map((d) => (
                <option key={d.dealer_id} value={d.dealer_id}>{d.company_name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block eyebrow text-stone-400 mb-1">Homeowner name *</label>
              <input value={homeowner} onChange={(e) => setHomeowner(e.target.value)} className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body" required />
            </div>
            <div>
              <label className="block eyebrow text-stone-400 mb-1">Homeowner email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block eyebrow text-stone-400 mb-1">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body" />
            </div>
            <div>
              <label className="block eyebrow text-stone-400 mb-1">Project address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body" />
            </div>
          </div>

          <div>
            <label className="block eyebrow text-stone-400 mb-1">Product interest</label>
            <select value={product} onChange={(e) => setProduct(e.target.value)} className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body">
              <option value="">—</option>
              <option value="Infinity Topless">Infinity Topless</option>
              <option value="Glass Component">Glass Component</option>
              <option value="Picket">Picket</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block eyebrow text-stone-400 mb-1">Est. project value ($)</label>
              <input type="number" value={estValue} onChange={(e) => setEstValue(e.target.value)} className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body" />
            </div>
            <div>
              <label className="block eyebrow text-stone-400 mb-1">Est. lineal footage</label>
              <input type="number" value={linealFt} onChange={(e) => setLinealFt(e.target.value)} className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body" />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm font-body">{error}</p>}

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-800">
            <button type="button" onClick={onClose} className="text-xs uppercase tracking-wider px-4 py-2 border border-stone-700 hover:border-gold text-stone-300 hover:text-gold font-body transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="text-xs uppercase tracking-wider px-6 py-2 bg-gold text-ink hover:bg-gold/80 font-body font-bold transition-colors disabled:opacity-50">
              {submitting ? "Creating…" : "Create lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
