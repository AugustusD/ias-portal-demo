"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type PendingDoc = {
  dealer_id: string;
  company_name: string;
  doc_type: "credit_app" | "customer_form";
  doc_label: string;
  path: string;
  uploaded_at: string;
};

export default function ReviewsPage() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("Admin");
  const [pending, setPending] = useState<PendingDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

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

      const { data: dealers } = await supabase
        .from("dealers")
        .select("id, company_name, customer_form_path, customer_form_uploaded_at, customer_form_admin_override, credit_app_path, credit_app_uploaded_at, credit_app_admin_override");

      const list: PendingDoc[] = [];
      (dealers || []).forEach((d) => {
        if (d.customer_form_path && !d.customer_form_admin_override) {
          list.push({
            dealer_id: d.id,
            company_name: d.company_name,
            doc_type: "customer_form",
            doc_label: "Customer Form",
            path: d.customer_form_path,
            uploaded_at: d.customer_form_uploaded_at,
          });
        }
        if (d.credit_app_path && !d.credit_app_admin_override) {
          list.push({
            dealer_id: d.id,
            company_name: d.company_name,
            doc_type: "credit_app",
            doc_label: "Credit Application",
            path: d.credit_app_path,
            uploaded_at: d.credit_app_uploaded_at,
          });
        }
      });

      setPending(list);
      setLoading(false);
    }
    load();
  }, [router, refreshKey]);

  async function handleView(path: string) {
    const { data, error } = await supabase.storage
      .from("private-documents")
      .createSignedUrl(path, 60);
    if (error || !data) {
      alert("Couldn't generate file link: " + (error?.message || "unknown"));
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  async function handleApprove(doc: PendingDoc) {
    if (!confirm(`Approve ${doc.doc_label} for ${doc.company_name}? File will be permanently deleted.`)) return;
    const key = `${doc.dealer_id}-${doc.doc_type}`;
    setActionInProgress(key);

    const { error: delErr } = await supabase.storage.from("private-documents").remove([doc.path]);
    if (delErr) { alert("Delete failed: " + delErr.message); setActionInProgress(null); return; }

    const updates: Record<string, unknown> = {
      [`${doc.doc_type}_path`]: null,
      [`${doc.doc_type}_deleted_at`]: new Date().toISOString(),
      [`${doc.doc_type}_admin_override`]: true,
    };
    const { error: dbErr } = await supabase.from("dealers").update(updates).eq("id", doc.dealer_id);
    if (dbErr) { alert("Record update failed: " + dbErr.message); setActionInProgress(null); return; }

    setActionInProgress(null);
    setRefreshKey((k) => k + 1);
  }

  async function handleReject(doc: PendingDoc) {
    if (!confirm(`Reject ${doc.doc_label} for ${doc.company_name}? Dealer will need to resubmit.`)) return;
    const key = `${doc.dealer_id}-${doc.doc_type}`;
    setActionInProgress(key);

    const { error: delErr } = await supabase.storage.from("private-documents").remove([doc.path]);
    if (delErr) { alert("Delete failed: " + delErr.message); setActionInProgress(null); return; }

    const updates: Record<string, unknown> = {
      [`${doc.doc_type}_path`]: null,
      [`${doc.doc_type}_deleted_at`]: new Date().toISOString(),
      [`${doc.doc_type}_admin_override`]: false,
    };
    const { error: dbErr } = await supabase.from("dealers").update(updates).eq("id", doc.dealer_id);
    if (dbErr) { alert("Record update failed: " + dbErr.message); setActionInProgress(null); return; }

    setActionInProgress(null);
    setRefreshKey((k) => k + 1);
  }

  function formatDate(s: string): string {
    return new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  }

  function timeAgo(s: string): string {
    const ms = Date.now() - new Date(s).getTime();
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  if (loading) {
    return <div className="section-container section-padding"><p className="text-stone-400">Loading...</p></div>;
  }

  return (
    <div className="bg-ink min-h-screen text-cream">
      <div className="border-b border-stone-800 bg-ink sticky top-0 z-20">
        <div className="section-container py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard" className="text-sm font-body text-stone-400 hover:text-cream">← Dashboard</Link>
            <span className="text-stone-700">/</span>
            <p className="eyebrow text-stone-400">Document Reviews</p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm font-body">
              <span className="text-stone-400">Signed in as</span>
              <span className="ml-2 font-semibold">{adminName}</span>
            </p>
            <button onClick={handleLogout} className="text-xs font-body uppercase tracking-wider border border-stone-700 hover:border-gold hover:text-gold px-4 py-2 transition-colors">Log Out</button>
          </div>
        </div>
      </div>

      <div className="section-container section-padding">
        <div className="mb-10">
          <p className="eyebrow text-gold mb-2">Document Reviews</p>
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-2">
            {pending.length === 0 ? "All caught up." : `${pending.length} document${pending.length === 1 ? "" : "s"} awaiting review`}
          </h2>
          <p className="font-body text-stone-400 max-w-2xl">
            Dealer submissions for credit applications and new customer forms. Click View to open the file. Approve to mark complete and securely delete from storage. Reject to require resubmission.
          </p>
        </div>

        {pending.length === 0 ? (
          <div className="bg-stone-900 border border-stone-800 p-12 text-center">
            <p className="font-body text-stone-400">No pending reviews.</p>
          </div>
        ) : (
          <div className="bg-stone-900 border border-stone-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-stone-950 text-stone-400">
                <tr className="border-b border-stone-800">
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Dealer</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Document</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Submitted</th>
                  <th className="text-right py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((doc) => {
                  const key = `${doc.dealer_id}-${doc.doc_type}`;
                  const busy = actionInProgress === key;
                  return (
                    <tr key={key} className="border-b border-stone-800 hover:bg-stone-800/50 transition-colors">
                      <td className="py-4 px-4">
                        <p className="font-body font-semibold text-cream">{doc.company_name}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-body text-sm text-cream">{doc.doc_label}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-body text-sm text-cream">{timeAgo(doc.uploaded_at)}</p>
                        <p className="font-body text-xs text-stone-500">{formatDate(doc.uploaded_at)}</p>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex gap-2">
                          <button onClick={() => handleView(doc.path)} disabled={busy} className="text-xs uppercase tracking-wider px-4 py-2 border border-stone-700 hover:border-gold hover:text-gold font-body transition-colors disabled:opacity-50">View</button>
                          <button onClick={() => handleApprove(doc)} disabled={busy} className="text-xs uppercase tracking-wider px-4 py-2 bg-gold text-ink hover:bg-gold/80 font-body font-bold transition-colors disabled:opacity-50">{busy ? "..." : "Approve"}</button>
                          <button onClick={() => handleReject(doc)} disabled={busy} className="text-xs uppercase tracking-wider px-4 py-2 border border-red-500 text-red-400 hover:bg-red-950 font-body transition-colors disabled:opacity-50">Reject</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-12 p-6 border border-stone-800 bg-stone-950">
          <p className="eyebrow text-gold mb-2">How this works</p>
          <ul className="font-body text-sm text-stone-400 space-y-1 list-disc pl-5">
            <li><strong className="text-cream">View</strong> opens the file in a new tab using a signed URL that expires in 60 seconds.</li>
            <li><strong className="text-cream">Approve</strong> deletes the file from storage and marks the document accepted. Dealer keeps &quot;Submitted&quot; status.</li>
            <li><strong className="text-cream">Reject</strong> deletes the file and clears the path so the dealer must resubmit.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
