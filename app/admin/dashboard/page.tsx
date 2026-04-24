"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import NewLeadModal from "./NewLeadModal";

type DealerStat = {
  dealer_id: string;
  company_name: string;
  contact_name: string | null;
  location: string | null;
  joined_date: string | null;
  onboarding_stage: "new" | "training" | "forms_pending" | "authorized" | "inactive";
  modules_complete: number;
  forms_submitted: number;
  last_activity_at: string | null;
};

type LeadRow = {
  id: string;
  homeowner_name: string | null;
  project_address: string | null;
  product_interest: string | null;
  project_value: number | null;
  stage: "new" | "accepted" | "bid_submitted" | "won" | "lost";
  updated_at: string;
  dealers: { company_name: string; location: string | null } | null;
};

const STAGE_LABELS: Record<DealerStat["onboarding_stage"], string> = {
  new: "New",
  forms_pending: "Forms Pending",
  training: "Training",
  authorized: "Authorized",
  inactive: "Inactive",
};

const LEAD_STAGE_LABELS: Record<LeadRow["stage"], string> = {
  new: "New",
  accepted: "Accepted",
  bid_submitted: "Bid Submitted",
  won: "Won",
  lost: "Lost",
};

const TOTAL_MODULES = 5;
const TOTAL_FORMS = 2;

function daysAgo(dateStr: string | null): number {
  if (!dateStr) return 999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminDashboard() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("Admin");
  const [dealers, setDealers] = useState<DealerStat[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"onboarding" | "leads">("onboarding");
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function loadData() {
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

      const { data: dealerData } = await supabase
        .from("dealer_dashboard_stats")
        .select("*")
        .order("joined_date", { ascending: false });
      setDealers((dealerData as DealerStat[]) || []);

      const { data: leadData } = await supabase
        .from("leads")
        .select("id, homeowner_name, project_address, product_interest, project_value, stage, updated_at, dealers(company_name, location)")
        .in("stage", ["new", "accepted", "bid_submitted"])
        .order("updated_at", { ascending: false });
      setLeads((leadData as unknown as LeadRow[]) || []);

      setLoading(false);
    }
    loadData();
  }, [router, refreshKey]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  if (loading) {
    return <div className="section-container section-padding"><p className="text-stone-600">Loading...</p></div>;
  }

  const totalDealers = dealers.length;
  const authorizedCount = dealers.filter((d) => d.onboarding_stage === "authorized").length;
  const inOnboardingCount = dealers.filter((d) => d.onboarding_stage !== "authorized" && d.onboarding_stage !== "inactive").length;

  const bottleneckDealers = dealers.filter((d) => {
    if (d.onboarding_stage === "authorized" || d.onboarding_stage === "inactive") return false;
    return daysAgo(d.last_activity_at) > 7;
  });
  const bottleneckCount = bottleneckDealers.length;

  const stalledLeads = leads.filter((l) => daysAgo(l.updated_at) > 14);
  const stalledLeadsCount = stalledLeads.length;
  const activeLeadsCount = leads.length;
  const totalPipelineValue = leads.reduce((s, l) => s + (l.project_value || 0), 0);
  const stalledPipelineValue = stalledLeads.reduce((s, l) => s + (l.project_value || 0), 0);

  return (
    <div className="bg-ink min-h-screen text-cream">
      <div className="border-b border-stone-800 bg-ink sticky top-0 z-20">
        <div className="section-container py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard" className="block">
              <p className="eyebrow text-gold">IAS · Internal</p>
              <h1 className="font-heading text-xl font-bold">Admin Console</h1>
            </Link>
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
        <div className="mb-10">
          <p className="eyebrow text-gold mb-2">Control Tower</p>
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-2">Ecosystem Overview</h2>
          <p className="font-body text-stone-400 max-w-2xl">
            Real-time visibility into dealer onboarding, active leads, and pipeline health. Identify bottlenecks and stalled deals before they become problems.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-stone-900 border border-stone-800 p-5">
            <p className="eyebrow text-stone-500 mb-2">Authorized</p>
            <p className="text-3xl font-heading font-bold text-cream">{authorizedCount}</p>
            <p className="text-xs text-stone-500 font-body mt-1">of {totalDealers} dealers</p>
          </div>
          <div className="bg-stone-900 border border-stone-800 p-5">
            <p className="eyebrow text-stone-500 mb-2">In Onboarding</p>
            <p className="text-3xl font-heading font-bold text-cream">{inOnboardingCount}</p>
            {bottleneckCount > 0 && (
              <p className="text-xs text-red-400 font-body font-semibold uppercase tracking-wider mt-1">{bottleneckCount} bottleneck{bottleneckCount === 1 ? "" : "s"}</p>
            )}
          </div>
          <div className="bg-stone-900 border border-stone-800 p-5">
            <p className="eyebrow text-stone-500 mb-2">Active Pipeline</p>
            <p className="text-3xl font-heading font-bold text-cream">${(totalPipelineValue / 1000).toFixed(1)}K</p>
            <p className="text-xs text-stone-500 font-body mt-1">{activeLeadsCount} active lead{activeLeadsCount === 1 ? "" : "s"}</p>
          </div>
          <div className="bg-stone-900 border border-stone-800 p-5">
            <p className="eyebrow text-stone-500 mb-2">Stalled Value</p>
            <p className="text-3xl font-heading font-bold text-gold">${(stalledPipelineValue / 1000).toFixed(1)}K</p>
            {stalledLeadsCount > 0 && (
              <p className="text-xs text-red-400 font-body font-semibold uppercase tracking-wider mt-1">{stalledLeadsCount} need attention</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 border-b border-stone-800">
          <button onClick={() => setActiveTab("onboarding")} className={`px-6 py-4 text-xs font-body font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === "onboarding" ? "border-gold text-cream" : "border-transparent text-stone-500 hover:text-cream"}`}>
            Onboarding Monitor ({totalDealers})
          </button>
          <button onClick={() => setActiveTab("leads")} className={`px-6 py-4 text-xs font-body font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === "leads" ? "border-gold text-cream" : "border-transparent text-stone-500 hover:text-cream"}`}>
            Lead Hopper ({activeLeadsCount})
          </button>
        </div>

        {activeTab === "onboarding" && (
          <div>
            {bottleneckCount > 0 && (
              <div className="mb-6 p-5 bg-red-950/30 border-l-4 border-red-500">
                <p className="eyebrow text-red-400 mb-2">Bottleneck Alert</p>
                <h3 className="font-heading text-lg font-bold mb-2">{bottleneckCount} dealer{bottleneckCount === 1 ? " is" : "s are"} stuck in onboarding.</h3>
                <p className="font-body text-sm text-stone-300">No training activity in over 7 days. Consider reaching out personally or offering a training session.</p>
              </div>
            )}

            <div className="bg-stone-900 border border-stone-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-950 text-stone-400">
                    <tr className="border-b border-stone-800">
                      <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Dealer</th>
                      <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Stage</th>
                      <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Training</th>
                      <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Forms</th>
                      <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Last Active</th>
                      <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dealers.map((d) => {
                      const days = daysAgo(d.last_activity_at);
                      const isBottleneck = d.onboarding_stage !== "authorized" && d.onboarding_stage !== "inactive" && days > 7;
                      return (
                        <tr key={d.dealer_id} className={`border-b border-stone-800 hover:bg-stone-800/50 transition-colors ${isBottleneck ? "bg-red-950/20" : ""}`}>
                          <td className="py-4 px-4">
                            <p className="font-body font-semibold text-cream">{d.company_name}</p>
                            <p className="text-xs text-stone-500 font-body">{d.location || "—"} · Joined {formatDate(d.joined_date)}</p>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`text-xs uppercase tracking-wider px-2.5 py-0.5 font-bold ${
                              d.onboarding_stage === "authorized" ? "bg-green-900 text-green-100" :
                              d.onboarding_stage === "training" ? "bg-amber-900 text-amber-100" :
                              d.onboarding_stage === "forms_pending" ? "bg-red-900 text-red-100" :
                              "bg-stone-800 text-stone-300"
                            }`}>
                              {STAGE_LABELS[d.onboarding_stage]}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-stone-800 h-1.5 overflow-hidden">
                                <div className="h-full bg-gold" style={{ width: `${(d.modules_complete / TOTAL_MODULES) * 100}%` }}></div>
                              </div>
                              <span className="text-xs font-body text-stone-400">{d.modules_complete}/{TOTAL_MODULES}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm font-body">
                            <span className={d.forms_submitted === TOTAL_FORMS ? "text-green-400" : "text-amber-400"}>
                              {d.forms_submitted}/{TOTAL_FORMS}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm font-body">
                            <span className={days > 7 && d.onboarding_stage !== "authorized" ? "text-red-400 font-semibold" : "text-stone-300"}>
                              {!d.last_activity_at ? "Never" : days === 0 ? "Today" : `${days}d ago`}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {isBottleneck ? (
                              <div className="flex items-center gap-2">
                                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="text-red-500 flex-shrink-0">
                                  <path d="M10 2L18 17H2L10 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                                  <path d="M10 8V10.5M10 13.5V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                <p className="text-xs font-body text-red-400">Inactive {days}d</p>
                              </div>
                            ) : (
                              <span className="text-xs font-body text-stone-500">On track</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {dealers.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-stone-500 font-body">No dealers yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "leads" && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setNewLeadOpen(true)}
                className="text-xs uppercase tracking-wider px-5 py-2.5 bg-gold text-ink hover:bg-gold/80 font-body font-bold transition-colors"
              >
                + New Lead
              </button>
            </div>

            {stalledLeadsCount > 0 && (
              <div className="mb-6 p-5 bg-gold/10 border-l-4 border-gold">
                <p className="eyebrow text-gold mb-2">Stalled Lead Alert</p>
                <h3 className="font-heading text-lg font-bold mb-2">
                  {stalledLeadsCount} lead{stalledLeadsCount === 1 ? " is" : "s are"} stalled — ${stalledPipelineValue.toLocaleString()} at risk.
                </h3>
                <p className="font-body text-sm text-stone-300">No movement in 14+ days. May benefit from direct support or builder outreach.</p>
              </div>
            )}

            <div className="bg-stone-900 border border-stone-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-950 text-stone-400">
                    <tr className="border-b border-stone-800">
                      <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Customer</th>
                      <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Dealer</th>
                      <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Project</th>
                      <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Stage</th>
                      <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Days</th>
                      <th className="text-right py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Est. Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => {
                      const days = daysAgo(lead.updated_at);
                      const stalled = days > 14;
                      return (
                        <tr key={lead.id} className={`border-b border-stone-800 hover:bg-stone-800/50 transition-colors ${stalled ? "bg-gold/5" : ""}`}>
                          <td className="py-4 px-4">
                            <p className="font-body font-semibold text-cream">{lead.homeowner_name || "—"}</p>
                            {stalled && (<p className="text-xs text-gold font-body font-semibold uppercase tracking-wider mt-1">Stalled</p>)}
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-body text-sm text-cream">{lead.dealers?.company_name || "—"}</p>
                            <p className="text-xs text-stone-500 font-body">{lead.dealers?.location || "—"}</p>
                          </td>
                          <td className="py-4 px-4 text-sm font-body text-stone-300">
                            {lead.product_interest || "—"}{lead.project_address ? ` · ${lead.project_address}` : ""}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`text-xs uppercase tracking-wider px-2.5 py-0.5 font-bold ${
                              lead.stage === "new" ? "bg-gold text-ink" :
                              lead.stage === "accepted" ? "bg-blue-900 text-blue-100" :
                              lead.stage === "bid_submitted" ? "bg-amber-900 text-amber-100" :
                              "bg-stone-800 text-stone-300"
                            }`}>
                              {LEAD_STAGE_LABELS[lead.stage]}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm font-body">
                            <span className={days > 14 ? "text-red-400 font-semibold" : stalled ? "text-gold font-semibold" : "text-stone-300"}>
                              {days}d
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-heading font-bold text-cream">${(lead.project_value || 0).toLocaleString()}</span>
                          </td>
                        </tr>
                      );
                    })}
                    {leads.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-stone-500 font-body">No active leads.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 p-6 border border-stone-800 bg-stone-950">
          <div className="flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gold flex-shrink-0 mt-0.5" aria-hidden="true">
              <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10 6V10.5M10 13V13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div>
              <p className="font-body text-sm text-stone-300 leading-relaxed">
                <span className="font-semibold text-cream">Live Data.</span>{" "}
                This dashboard pulls real-time stats from Supabase. Bottleneck threshold: 7+ days with no training activity. Stalled lead threshold: 14+ days in same stage.
              </p>
            </div>
          </div>
        </div>
      </div>

      <NewLeadModal
        open={newLeadOpen}
        onClose={() => setNewLeadOpen(false)}
        onCreated={() => setRefreshKey((k) => k + 1)}
        dealers={dealers.map((d) => ({ dealer_id: d.dealer_id, company_name: d.company_name }))}
      />
    </div>
  );
}
