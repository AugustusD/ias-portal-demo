"use client";

import { useEffect, useState } from "react";
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

type DuplicateMatch = {
  id: string;
  project_name: string | null;
  contact_company: string | null;
  stage: string;
  dealer_id: string;
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
  // Meeting items
  const [projectName, setProjectName] = useState("");
  const [contactCompany, setContactCompany] = useState("");
  const [bidDueDate, setBidDueDate] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [duplicate, setDuplicate] = useState<DuplicateMatch | null>(null);
  const [overrideDup, setOverrideDup] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Duplicate detection — fires when both project_name + contact_company set
  useEffect(() => {
    const pn = projectName.trim().toLowerCase();
    const cc = contactCompany.trim().toLowerCase();
    if (!pn || !cc) {
      setDuplicate(null);
      return;
    }
    const t = setTimeout(async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, project_name, contact_company, stage, dealer_id")
        .ilike("project_name", pn)
        .ilike("contact_company", cc)
        .limit(1);
      if (error || !data || data.length === 0) {
        setDuplicate(null);
        return;
      }
      setDuplicate(data[0] as DuplicateMatch);
    }, 350);
    return () => clearTimeout(t);
  }, [projectName, contactCompany]);

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
    setProjectName("");
    setContactCompany("");
    setBidDueDate("");
    setAttachments([]);
    setDuplicate(null);
    setOverrideDup(false);
    setError("");
  }

  function addFiles(fileList: FileList | File[] | null) {
    if (!fileList) return;
    const arr = Array.from(fileList);
    setAttachments((prev) => [...prev, ...arr]);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!dealerId) { setError("Please assign to a dealer."); return; }
    if (duplicate && !overrideDup) {
      setError("This looks like a duplicate. Tick the override box below if you want to send it anyway.");
      return;
    }

    setSubmitting(true);

    const { data: insertData, error: insertError } = await supabase
      .from("leads")
      .insert({
        dealer_id: dealerId,
        customer_type: customerType || null,
        homeowner_name: contactName.trim() || null,
        homeowner_phone: contactPhone.trim() || null,
        homeowner_email: contactEmail.trim() || null,
        city: city.trim() || null,
        province: province.trim() || null,
        notes: notes.trim() || null,
        project_name: projectName.trim() || null,
        contact_company: contactCompany.trim() || null,
        bid_due_date: bidDueDate || null,
        stage: "new",
      })
      .select("id")
      .single();

    if (insertError || !insertData) {
      setSubmitting(false);
      setError(insertError?.message ?? "Couldn't create lead.");
      return;
    }

    const leadId = insertData.id;

    // Upload attachments (if any) and patch the row with their paths
    if (attachments.length > 0) {
      const uploaded: { path: string; filename: string; uploaded_at: string }[] = [];
      for (let i = 0; i < attachments.length; i++) {
        const f = attachments[i];
        const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `leads/${leadId}/email/${Date.now()}-${i}-${safeName}`;
        const { error: upErr } = await supabase.storage
          .from("private-documents")
          .upload(path, f, { contentType: f.type || "application/octet-stream", upsert: false });
        if (upErr) {
          setError(`Lead created but upload failed for ${f.name}: ${upErr.message}`);
          setSubmitting(false);
          return;
        }
        uploaded.push({
          path,
          filename: f.name,
          uploaded_at: new Date().toISOString(),
        });
      }
      await supabase.from("leads").update({ lead_attachment_paths: uploaded }).eq("id", leadId);
    }

    setSubmitting(false);
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
          {/* Project — Mike & Fred wanted these as the primary identifying fields */}
          <div>
            <label className="block eyebrow text-stone-400 mb-1">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Harbour View Towers, Phase 2"
              className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block eyebrow text-stone-400 mb-1">Contracting Company</label>
              <input
                type="text"
                value={contactCompany}
                onChange={(e) => setContactCompany(e.target.value)}
                placeholder="e.g. Insignia Construction"
                className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body"
              />
              <p className="text-xs text-stone-500 mt-1 font-body italic">Used for duplicate detection.</p>
            </div>
            <div>
              <label className="block eyebrow text-stone-400 mb-1">Bid Due Date</label>
              <input
                type="date"
                value={bidDueDate}
                onChange={(e) => setBidDueDate(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body"
              />
            </div>
          </div>

          {/* Duplicate banner */}
          {duplicate && (
            <div className="p-3 bg-amber-950/60 border border-amber-700">
              <p className="text-amber-200 font-body text-sm font-semibold mb-1">
                ⚠️ Possible duplicate
              </p>
              <p className="text-amber-100 font-body text-xs mb-2">
                A lead for &ldquo;{duplicate.project_name}&rdquo; from &ldquo;{duplicate.contact_company}&rdquo; already
                exists (current stage: <span className="font-bold">{duplicate.stage}</span>).
              </p>
              <label className="flex items-center gap-2 text-amber-100 text-xs font-body cursor-pointer">
                <input type="checkbox" checked={overrideDup} onChange={(e) => setOverrideDup(e.target.checked)} className="accent-amber-400" />
                Send it anyway — this is a different request for the same project.
              </label>
            </div>
          )}

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

          {/* Email / file drag-drop */}
          <div>
            <label className="block eyebrow text-stone-400 mb-1">Email / Attachments</label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed p-6 text-center transition-colors ${isDragging ? "border-gold bg-gold/10" : "border-stone-700 bg-stone-950"}`}
            >
              <p className="font-body text-sm text-stone-400 mb-2">
                Drag in the original email or any related files (.eml, .msg, .pdf, .jpg…)
              </p>
              <label className="inline-block">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />
                <span className="text-xs uppercase tracking-wider px-4 py-2 border border-stone-600 text-stone-300 hover:text-gold hover:border-gold font-body cursor-pointer inline-block">
                  Or browse…
                </span>
              </label>
            </div>
            {attachments.length > 0 && (
              <ul className="mt-2 space-y-1">
                {attachments.map((f, i) => (
                  <li key={i} className="flex items-center justify-between text-xs font-body text-stone-300 bg-stone-950 border border-stone-800 px-3 py-1.5">
                    <span className="truncate">📎 {f.name} <span className="text-stone-500">({Math.ceil(f.size / 1024)} KB)</span></span>
                    <button type="button" onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))} className="text-stone-500 hover:text-red-400 ml-2">×</button>
                  </li>
                ))}
              </ul>
            )}
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
