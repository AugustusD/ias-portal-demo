"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { humanizeError } from "@/lib/errors";

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

  // Escape closes the modal — routes through attemptClose so the discard
  // confirm fires if any field has been touched. We stash the latest
  // attemptClose in a ref so the listener doesn't have to re-subscribe on
  // every keystroke (which would happen if attemptClose was in the dep
  // array, since it's recreated each render).
  const closeRef = useRef<() => void>(() => {});
  closeRef.current = () => {
    if (submitting) return;
    const dirty = Boolean(
      dealerId || customerType || contactName || contactPhone || contactEmail ||
      city || province || notes || projectName || contactCompany || bidDueDate ||
      attachments.length > 0
    );
    if (dirty && !confirm("Discard this lead? Your changes will be lost.")) return;
    reset();
    onClose();
  };
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Duplicate detection — fires when both project_name + contact_company set.
  // Only checks ACTIVE stages (new/accepted/bid_submitted/won). Declined and lost
  // are terminal so they shouldn't block a fresh attempt at the same project.
  useEffect(() => {
    const pn = projectName.trim().toLowerCase();
    const cc = contactCompany.trim().toLowerCase();
    if (!pn || !cc) {
      setDuplicate(null);
      setOverrideDup(false); // clear stale override if user changes inputs
      return;
    }
    const t = setTimeout(async () => {
      // Escape ilike wildcards in user input so a stray % or _ in a project
      // name doesn't match every row in the table.
      const escapeIlike = (s: string) => s.replace(/[\\%_]/g, "\\$&");
      const { data, error } = await supabase
        .from("leads")
        .select("id, project_name, contact_company, stage, dealer_id")
        .ilike("project_name", escapeIlike(pn))
        .ilike("contact_company", escapeIlike(cc))
        .in("stage", ["new", "accepted", "bid_submitted", "won"])
        .limit(1);
      if (error || !data || data.length === 0) {
        setDuplicate(null);
        setOverrideDup(false); // dup cleared → reset override so it doesn't auto-apply if user re-enters dup
        return;
      }
      setDuplicate(data[0] as DuplicateMatch);
    }, 350);
    return () => clearTimeout(t);
  }, [projectName, contactCompany]);

  if (!open) return null;

  // Dirty-check — guards against accidental dismissal (backdrop click, ×,
  // Cancel) when the user has typed anything. Doesn't fire if literally
  // nothing has been entered (so opening + immediately closing is silent).
  function isDirty(): boolean {
    return Boolean(
      dealerId || customerType || contactName || contactPhone || contactEmail ||
      city || province || notes || projectName || contactCompany || bidDueDate ||
      attachments.length > 0
    );
  }

  function attemptClose() {
    if (submitting) return; // never dismiss mid-submit
    if (isDirty() && !confirm("Discard this lead? Your changes will be lost.")) return;
    reset();
    onClose();
  }

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

  // 25 MB per-file cap — generous for a scanned PDF or a .eml with inline
  // images, but blocks someone from dragging in a 500 MB video and quietly
  // burning through the Supabase storage quota. Supabase Free is 1 GB total.
  const MAX_FILE_BYTES = 25 * 1024 * 1024;

  function addFiles(fileList: FileList | File[] | null) {
    if (!fileList) return;
    const arr = Array.from(fileList);
    const oversized = arr.filter((f) => f.size > MAX_FILE_BYTES);
    const okay = arr.filter((f) => f.size <= MAX_FILE_BYTES);
    if (oversized.length > 0) {
      setError(`File${oversized.length > 1 ? "s" : ""} too large (max 25 MB): ${oversized.map((f) => f.name).join(", ")}`);
    }
    if (okay.length > 0) {
      setAttachments((prev) => [...prev, ...okay]);
    }
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
      // humanizeError maps raw supabase / PG codes (CHECK violations,
      // FK violations, network errors) to friendlier copy. Without it
      // an admin sees the raw "duplicate key value violates unique
      // constraint" / "values outside the allowed range" strings.
      setError(humanizeError(insertError, "Couldn't create lead."));
      return;
    }

    const leadId = insertData.id;

    // Upload attachments (if any) and patch the row after EACH success so a
    // mid-batch failure doesn't orphan files in storage that the row never references.
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
          setError(`Lead created. Upload failed at ${f.name}: ${upErr.message}. ${uploaded.length} attachment(s) before this were saved.`);
          setSubmitting(false);
          return;
        }
        uploaded.push({
          path,
          filename: f.name,
          uploaded_at: new Date().toISOString(),
        });
        // Persist after each successful upload — keeps DB and storage in sync
        await supabase.from("leads").update({ lead_attachment_paths: uploaded }).eq("id", leadId);
      }
    }

    setSubmitting(false);
    reset();
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={attemptClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-lead-title"
        className="bg-stone-900 border border-stone-800 max-w-2xl lg:max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-stone-800 flex items-center justify-between">
          <div>
            <p className="eyebrow text-gold mb-1">New Lead</p>
            <h2 id="new-lead-title" className="font-heading text-xl font-bold text-cream">Forward to Dealer</h2>
          </div>
          <button onClick={attemptClose} aria-label="Close dialog" className="text-stone-500 hover:text-cream text-2xl leading-none">×</button>
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
              maxLength={200}
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
                maxLength={200}
                className="w-full bg-stone-950 border border-stone-700 text-cream px-3 py-2 font-body"
              />
              <p className="text-xs text-stone-500 mt-1 font-body italic">Used for duplicate detection.</p>
            </div>
            <div>
              <label className="block eyebrow text-stone-400 mb-1">Bid Due Date</label>
              <input
                type="date"
                value={bidDueDate}
                // min={today}: native browser-level guard against picking a
                // past date when creating a new lead. The detail view already
                // flags overdue bids in red, but it's a confusing signal if
                // the lead was created overdue.
                min={new Date().toISOString().split("T")[0]}
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
              maxLength={200}
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
              maxLength={5000}
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
                    <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))} className="text-stone-500 hover:text-red-400 ml-2">×</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <p className="text-red-400 text-sm font-body">{error}</p>}

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-800">
            <button type="button" onClick={attemptClose} className="text-xs uppercase tracking-wider px-4 py-2 border border-stone-700 hover:border-gold text-stone-300 hover:text-gold font-body transition-colors">
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
