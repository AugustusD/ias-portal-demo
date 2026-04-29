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
  credit_app_path: string | null;
  credit_app_uploaded_at: string | null;
  credit_app_admin_override: boolean;
  customer_form_path: string | null;
  customer_form_uploaded_at: string | null;
  customer_form_admin_override: boolean;
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

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/admin/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", session.user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        router.push("/admin/login");
        return;
      }
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

  async function viewDocument(path: string) {
    const { data, error: urlErr } = await supabase.storage
      .from("private-documents")
      .createSignedUrl(path, 60);
    if (urlErr || !data) {
      alert("Couldn't generate file link: " + (urlErr?.message || "unknown"));
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  if (loading) {
    return <div className="bg-ink min-h-screen text-cream"><div className="section-container section-padding"><p className="text-stone-400">Loading...</p></div></div>;
  }

  if (error || !dealer) {
    return (
      <div className="bg-ink min-h-screen text-cream">
        <div className="section-container section-padding">
          <p className="text-stone-400 mb-4">{error || "Dealer not found."}</p>
          <Link href="/admin/dashboard" className="text-xs uppercase tracking-wider px-5 py-2.5 bg-gold text-ink hover:bg-gold/80 font-body font-bold transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const wonLeads = leads.filter((l) => l.stage === "won");
  const activeLeads = leads.filter((l) => ["new", "accepted", "bid_submitted"].includes(l.stage));
  const totalWonValue = wonLeads.reduce((s, l) => s + (l.project_value || 0), 0);

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
            <p className="text-sm font-body">
              <span className="text-stone-400">Signed in as</span>
              <span className="ml-2 font-semibold">{adminName}</span>
            </p>
            <button onClick={handleLogout} className="text-xs font-body uppercase tracking-wider border border-stone-700 hover:border-gold hover:text-gold px-4 py-2 transition-colors">
              Log Out
            </button>
          </div>
        </div>
      </div>

      <div className="section-container section-padding">
        {/* Hero */}
        <div className="mb-10">
          <p className="eyebrow text-gold mb-2">Dealer</p>
          <div className="flex items-baseline gap-4 flex-wrap mb-3">
            <h1 className="font-heading text-4xl md:text-5xl font-bold">{dealer.company_name}</h1>
            <span className={`text-xs uppercase tracking-wider px-3 py-1 font-bold ${
              dealer.onboarding_stage === "authorized" ? "bg-green-900 text-green-100" :
              dealer.onboarding_stage === "training" ? "bg-amber-900 text-amber-100" :
              dealer.onboarding_stage === "forms_pending" ? "bg-red-900 text-red-100" :
              "bg-stone-800 text-stone-300"
            }`}>
              {STAGE_LABELS[dealer.onboarding_stage] || dealer.onboarding_stage}
            </span>
          </div>
          <p className="font-body text-stone-400">
            {dealer.location || "—"} · Joined {formatDate(dealer.joined_date)}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-stone-900 border border-stone-800 p-5">
            <p className="eyebrow text-stone-500 mb-2">Team</p>
            <p className="text-3xl font-heading font-bold text-cream">{team.length}</p>
            <p className="text-xs text-stone-500 font-body mt-1">{team.length === 1 ? "user" : "users"}</p>
          </div>
          <div className="bg-stone-900 border border-stone-800 p-5">
            <p className="eyebrow text-stone-500 mb-2">Active Leads</p>
            <p className="text-3xl font-heading font-bold text-cream">{activeLeads.length}</p>
            <p className="text-xs text-stone-500 font-body mt-1">in pipeline</p>
          </div>
          <div className="bg-stone-900 border border-stone-800 p-5">
            <p className="eyebrow text-stone-500 mb-2">Won</p>
            <p className="text-3xl font-heading font-bold text-cream">{wonLeads.length}</p>
            <p className="text-xs text-stone-500 font-body mt-1">total</p>
          </div>
          <div className="bg-stone-900 border border-stone-800 p-5">
            <p className="eyebrow text-stone-500 mb-2">Won Value</p>
            <p className="text-3xl font-heading font-bold text-gold">${(totalWonValue / 1000).toFixed(1)}K</p>
            <p className="text-xs text-stone-500 font-body mt-1">all time</p>
          </div>
        </div>

        {/* Business Info (the customer form data) */}
        <div className="mb-10 bg-stone-900 border border-stone-800 p-6">
          <p className="eyebrow text-gold mb-4">Business Info</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 font-body">
            <div>
              <p className="text-xs uppercase tracking-wider text-stone-500 mb-1">Contact Person</p>
              <p className="text-cream">{dealer.contact_name || "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-stone-500 mb-1">Email</p>
              <p className="text-cream">{dealer.email || "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-stone-500 mb-1">Phone</p>
              <p className="text-cream">{dealer.phone || "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-stone-500 mb-1">Website</p>
              <p className="text-cream">
                {dealer.website ? (
                  <a href={dealer.website} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">{dealer.website}</a>
                ) : "—"}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-wider text-stone-500 mb-1">Address</p>
              <p className="text-cream">
                {[dealer.street_address, dealer.city, dealer.province, dealer.postal_code].filter(Boolean).join(", ") || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-stone-500 mb-1">Years in Business</p>
              <p className="text-cream">{dealer.years_in_business ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-stone-500 mb-1">Joined IAS</p>
              <p className="text-cream">{formatDate(dealer.joined_date)}</p>
            </div>
            {dealer.notes && (
              <div className="md:col-span-2">
                <p className="text-xs uppercase tracking-wider text-stone-500 mb-1">Notes</p>
                <p className="text-cream whitespace-pre-wrap">{dealer.notes}</p>
              </div>
            )}
          </div>
        </div>



        {/* Team */}
        <div className="mb-10 bg-stone-900 border border-stone-800 overflow-hidden">
          <div className="p-6 border-b border-stone-800 flex items-center justify-between">
            <p className="eyebrow text-gold">Team ({team.length})</p>
            <p className="text-xs font-body text-stone-500">Users registered under this dealer</p>
          </div>
          {team.length === 0 ? (
            <div className="p-6 text-center font-body text-stone-500">
              No team members yet. They&apos;ll appear here once someone registers via the dealer&apos;s invite link.
            </div>
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
                    <td className="py-4 px-4 font-body text-sm">
                      <span className={m.modules_complete === 5 ? "text-green-400" : "text-stone-300"}>
                        {m.modules_complete}/5 modules
                      </span>
                    </td>
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
            <div className="p-6 text-center font-body text-stone-500">
              No leads yet. Create one from the admin dashboard Lead Hopper.
            </div>
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
                    <td className="py-4 px-4 font-body text-sm text-stone-300 capitalize">
                      {lead.customer_type || "—"}
                    </td>
                    <td className="py-4 px-4 font-body text-sm text-stone-300">
                      {[lead.city, lead.province].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-xs uppercase tracking-wider px-2.5 py-0.5 font-bold ${
                        lead.stage === "won" ? "bg-green-900 text-green-100" :
                        lead.stage === "lost" ? "bg-stone-800 text-stone-300" :
                        lead.stage === "new" ? "bg-gold text-ink" :
                        lead.stage === "accepted" ? "bg-blue-900 text-blue-100" :
                        "bg-amber-900 text-amber-100"
                      }`}>
                        {LEAD_STAGE_LABELS[lead.stage] || lead.stage}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-body text-sm text-stone-300">{timeAgo(lead.received_at)}</td>
                    <td className="py-4 px-4 text-right font-heading font-bold text-cream">
                      ${(lead.project_value || 0).toLocaleString()}
                    </td>
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
