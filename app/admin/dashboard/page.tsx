"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import NewLeadModal from "./NewLeadModal";
import EditLeadModal, { EditLead } from "./EditLeadModal";

type DealerStat = {
  dealer_id: string;
  company_name: string;
  contact_name: string | null;
  location: string | null;
  joined_date: string | null;
  onboarding_stage: "new" | "training" | "forms_pending" | "pending_final_approval" | "approved" | "authorized" | "inactive";
  modules_complete: number;
  forms_submitted: number;
  last_activity_at: string | null;
};

type ActivityEvent = {
  kind: string;
  at: string;
  record_id: string;
  actor: string | null;
  subject: string | null;
  detail: string | null;
};

type LeadRow = {
  id: string;
  dealer_id: string;
  customer_type: "homeowner" | "builder" | null;
  homeowner_name: string | null;
  homeowner_phone: string | null;
  homeowner_email: string | null;
  city: string | null;
  province: string | null;
  notes: string | null;
  product_interest: string | null;
  stage: "new" | "accepted" | "bid_submitted" | "won" | "lost" | "declined";
  updated_at: string;
  project_name: string | null;
  contact_company: string | null;
  bid_due_date: string | null;
  dealers: { company_name: string; location: string | null } | null;
};

const STAGE_LABELS: Record<DealerStat["onboarding_stage"], string> = {
  new: "Pending",
  training: "In Training",
  forms_pending: "Forms Pending",
  pending_final_approval: "Pending Final Approval",
  approved: "Approved",
  authorized: "Authorized",
  inactive: "Inactive",
};

const LEAD_STAGE_LABELS: Record<LeadRow["stage"], string> = {
  new: "New",
  accepted: "Accepted",
  bid_submitted: "Bid Submitted",
  won: "Won",
  lost: "Lost",
  declined: "Declined",
};

const TOTAL_MODULES = 5;

function daysAgo(dateStr: string | null): number {
  if (!dateStr) return 999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function timeAgoShort(dateStr: string | null): string {
  if (!dateStr) return "";
  const mins = Math.max(1, Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const ACTIVITY_LABELS: Record<string, { label: string; color: string }> = {
  lead_created:        { label: "New lead created",       color: "text-cream" },
  lead_accepted:       { label: "Lead accepted",          color: "text-blue-400" },
  lead_bid_submitted:  { label: "Bid submitted",          color: "text-amber-400" },
  lead_won:            { label: "Project won",            color: "text-emerald-400" },
  lead_lost:           { label: "Lead lost",              color: "text-stone-400" },
  lead_declined:       { label: "Lead declined",          color: "text-amber-200" },
  dealer_signup:       { label: "New dealer signed up",   color: "text-gold" },
  warranty_registered: { label: "Warranty registered",    color: "text-gold" },
};

export default function AdminDashboard() {
  const router = useRouter();
  // URL-driven active tab. Deep links like /admin/dashboard?tab=leads now
  // open directly to the leads view, and the browser back button restores
  // the previous tab. Without this, the back button broke navigation for
  // anyone using the tabs as if they were sub-pages.
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams?.get("tab");
  const initialTab: "onboarding" | "leads" = tabFromUrl === "leads" ? "leads" : "onboarding";

  const [adminName, setAdminName] = useState("Admin");
  const [dealers, setDealers] = useState<DealerStat[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTabState] = useState<"onboarding" | "leads">(initialTab);

  // Wrap setActiveTab so a click also pushes a new history entry.
  // replaceState would prevent back-button restoration; pushState gives the
  // expected browser behavior.
  function setActiveTab(tab: "onboarding" | "leads") {
    setActiveTabState(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (tab === "onboarding") url.searchParams.delete("tab");
      else url.searchParams.set("tab", tab);
      window.history.pushState({}, "", url.toString());
    }
  }

  // Sync back/forward navigation (popstate) to local state.
  useEffect(() => {
    const onPop = () => {
      const t = new URL(window.location.href).searchParams.get("tab");
      setActiveTabState(t === "leads" ? "leads" : "onboarding");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<EditLead | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dealerSearch, setDealerSearch] = useState("");
  const [dealerStageFilter, setDealerStageFilter] = useState<string>("all");
  const [leadSearch, setLeadSearch] = useState("");
  const [leadStageFilter, setLeadStageFilter] = useState<string>("all");

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      // maybeSingle so a missing profile row routes to login instead of
      // throwing an unhandled error inside the effect.
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!profile || profile.role !== "admin") {
        router.push("/login");
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
        .select("id, dealer_id, customer_type, homeowner_name, homeowner_phone, homeowner_email, city, province, notes, product_interest, stage, updated_at, project_name, contact_company, bid_due_date, dealers(company_name, location)")
        .in("stage", ["new", "accepted", "bid_submitted"])
        .order("bid_due_date", { ascending: true, nullsFirst: false })
        .order("updated_at", { ascending: false });
      setLeads((leadData as unknown as LeadRow[]) || []);

      const { data: activityData } = await supabase
        .from("recent_activity")
        .select("*")
        .order("at", { ascending: false, nullsFirst: false })
        .limit(15);
      setActivity((activityData as ActivityEvent[]) || []);

      setLoading(false);
    }
    loadData();
  }, [router, refreshKey]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function openEditLead(lead: LeadRow) {
    setEditingLead({
      id: lead.id,
      dealer_id: lead.dealer_id,
      customer_type: lead.customer_type,
      homeowner_name: lead.homeowner_name,
      homeowner_phone: lead.homeowner_phone,
      homeowner_email: lead.homeowner_email,
      city: lead.city,
      province: lead.province,
      notes: lead.notes,
      project_name: lead.project_name,
      contact_company: lead.contact_company,
      bid_due_date: lead.bid_due_date,
    });
  }

  if (loading) {
    return <div className="section-container section-padding"><p className="text-stone-600">Loading...</p></div>;
  }

  const totalDealers = dealers.length;
  const authorizedCount = dealers.filter((d) => d.onboarding_stage === "authorized").length;
  const inOnboardingCount = dealers.filter((d) => d.onboarding_stage !== "authorized" && d.onboarding_stage !== "inactive").length;

  // Dealers who finished all 5 modules and are waiting on admin sign-off.
  // These are NOT bottlenecks — the ball is in admin's court.
  const pendingFinalApprovalDealers = dealers.filter((d) => d.onboarding_stage === "pending_final_approval");
  const pendingFinalApprovalCount = pendingFinalApprovalDealers.length;

  const bottleneckDealers = dealers.filter((d) => {
    if (d.onboarding_stage === "authorized" || d.onboarding_stage === "inactive") return false;
    // pending_final_approval = waiting on admin, not stuck on the dealer's side
    if (d.onboarding_stage === "pending_final_approval") return false;
    return daysAgo(d.last_activity_at) > 7;
  });
  const bottleneckCount = bottleneckDealers.length;

  const stalledLeads = leads.filter((l) => daysAgo(l.updated_at) > 14);
  const stalledLeadsCount = stalledLeads.length;
  const activeLeadsCount = leads.length;
  const todayStr = new Date().toISOString().split("T")[0];
  const overdueBidsCount = leads.filter((l) => l.bid_due_date && l.bid_due_date < todayStr).length;
  const dueThisWeekCount = leads.filter((l) => {
    if (!l.bid_due_date) return false;
    const days = Math.floor((new Date(l.bid_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 7;
  }).length;

  // Search + filter
  const dq = dealerSearch.trim().toLowerCase();
  const visibleDealers = dealers.filter((d) => {
    if (dealerStageFilter !== "all" && d.onboarding_stage !== dealerStageFilter) return false;
    if (!dq) return true;
    return (
      d.company_name?.toLowerCase().includes(dq) ||
      d.contact_name?.toLowerCase().includes(dq) ||
      d.location?.toLowerCase().includes(dq)
    );
  });
  const lq = leadSearch.trim().toLowerCase();
  const visibleLeads = leads.filter((l) => {
    if (leadStageFilter !== "all" && l.stage !== leadStageFilter) return false;
    if (!lq) return true;
    return (
      l.project_name?.toLowerCase().includes(lq) ||
      l.contact_company?.toLowerCase().includes(lq) ||
      l.homeowner_name?.toLowerCase().includes(lq) ||
      l.dealers?.company_name?.toLowerCase().includes(lq) ||
      l.city?.toLowerCase().includes(lq)
    );
  });

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
          <div className="flex items-center gap-3 md:gap-4">
            <p className="hidden md:block text-sm font-body">
              <span className="text-stone-400">Signed in as</span>
              <span className="ml-2 font-semibold">{adminName}</span>
            </p>
            <button onClick={handleLogout} className="text-xs font-body uppercase tracking-wider border border-stone-700 hover:border-gold hover:text-gold px-3 md:px-4 py-2 transition-colors whitespace-nowrap">Log Out</button>
          </div>
        </div>
      </div>

      <div className="section-container section-padding">
        <div className="mb-10">
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-2">Dashboard</h2>
          <p className="font-body text-stone-400 max-w-2xl">Live view of dealer onboarding, lead pipeline, bid urgency, and the last 30 days of activity.</p>
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
            {pendingFinalApprovalCount > 0 && (
              <p className="text-xs text-gold font-body font-semibold uppercase tracking-wider mt-1">{pendingFinalApprovalCount} awaiting approval</p>
            )}
            {bottleneckCount > 0 && (
              <p className="text-xs text-red-400 font-body font-semibold uppercase tracking-wider mt-1">{bottleneckCount} bottleneck{bottleneckCount === 1 ? "" : "s"}</p>
            )}
          </div>
          <div className="bg-stone-900 border border-stone-800 p-5">
            <p className="eyebrow text-stone-500 mb-2">Active Leads</p>
            <p className="text-3xl font-heading font-bold text-cream">{activeLeadsCount}</p>
            {stalledLeadsCount > 0 && (
              <p className="text-xs text-red-400 font-body font-semibold uppercase tracking-wider mt-1">{stalledLeadsCount} stalled</p>
            )}
          </div>
          <div className={`p-5 ${overdueBidsCount > 0 ? "bg-red-950 border border-red-800" : "bg-stone-900 border border-stone-800"}`}>
            <p className={`eyebrow mb-2 ${overdueBidsCount > 0 ? "text-red-400" : "text-stone-500"}`}>Bids Overdue</p>
            <p className={`text-3xl font-heading font-bold ${overdueBidsCount > 0 ? "text-red-200" : "text-cream"}`}>{overdueBidsCount}</p>
            {dueThisWeekCount > 0 && (
              <p className="text-xs text-stone-400 font-body mt-1">{dueThisWeekCount} more due this week</p>
            )}
          </div>
        </div>

        {/* Recent activity feed */}
        {activity.length > 0 && (
          <div className="mb-10 bg-stone-900 border border-stone-800">
            <div className="px-5 py-3 border-b border-stone-800 flex items-baseline justify-between">
              <p className="eyebrow text-stone-500">Recent Activity</p>
              <p className="text-xs font-body text-stone-600">Last 30 days</p>
            </div>
            <ul className="divide-y divide-stone-800">
              {activity.map((ev, i) => {
                const meta = ACTIVITY_LABELS[ev.kind] || { label: ev.kind, color: "text-stone-300" };
                return (
                  <li key={i} className="px-5 py-3 flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-sm font-body">
                    <div className="flex items-center gap-2 md:gap-3 md:flex-shrink-0">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${meta.color.replace("text-", "bg-")}`} aria-hidden></span>
                      <span className={`${meta.color} font-semibold md:w-44`}>{meta.label}</span>
                      <span className="md:hidden ml-auto text-stone-500 text-xs">{timeAgoShort(ev.at)} ago</span>
                    </div>
                    <span className="text-stone-300 min-w-0 truncate flex-1 pl-3.5 md:pl-0">
                      <span className="font-semibold">{ev.actor || "Someone"}</span>
                      {ev.subject && <span className="text-stone-500"> · {ev.subject}</span>}
                      {ev.detail && <span className="text-stone-500"> · {ev.detail}</span>}
                    </span>
                    <span className="hidden md:inline-block flex-shrink-0 text-stone-500 text-xs w-12 text-right">{timeAgoShort(ev.at)} ago</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6 border-b border-stone-800">
          <button onClick={() => setActiveTab("onboarding")} className={`px-6 py-4 text-xs font-body font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === "onboarding" ? "border-gold text-cream" : "border-transparent text-stone-500 hover:text-cream"}`}>
            Dealers ({totalDealers})
          </button>
          <button onClick={() => setActiveTab("leads")} className={`px-6 py-4 text-xs font-body font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === "leads" ? "border-gold text-cream" : "border-transparent text-stone-500 hover:text-cream"}`}>
            Lead Hopper ({activeLeadsCount})
          </button>
        </div>

        {activeTab === "onboarding" && (
          <div>
            {pendingFinalApprovalCount > 0 && (
              <div className="mb-6 p-5 bg-gold/10 border-l-4 border-gold">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="eyebrow text-gold mb-2">Pending Final Approval</p>
                    <h3 className="font-heading text-lg font-bold mb-2">
                      {pendingFinalApprovalCount} dealer{pendingFinalApprovalCount === 1 ? "" : "s"} finished onboarding and {pendingFinalApprovalCount === 1 ? "is" : "are"} waiting on your sign-off.
                    </h3>
                    <p className="font-body text-sm text-stone-300 mb-3">Open each dealer to review their info and either approve or authorize them so they can use the apps.</p>
                  </div>
                  <button
                    onClick={() => setDealerStageFilter("pending_final_approval")}
                    className="text-xs uppercase tracking-wider px-4 py-2 bg-gold text-ink hover:bg-gold/80 font-body font-bold transition-colors whitespace-nowrap"
                  >
                    Show {pendingFinalApprovalCount} dealer{pendingFinalApprovalCount === 1 ? "" : "s"}
                  </button>
                </div>
              </div>
            )}

            {bottleneckCount > 0 && (
              <div className="mb-6 p-5 bg-red-950/30 border-l-4 border-red-500">
                <p className="eyebrow text-red-400 mb-2">Bottleneck Alert</p>
                <h3 className="font-heading text-lg font-bold mb-2">{bottleneckCount} dealer{bottleneckCount === 1 ? " is" : "s are"} stuck in onboarding.</h3>
                <p className="font-body text-sm text-stone-300">Click a dealer row to see their info, team, and leads.</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 mb-4">
              <label className="sr-only" htmlFor="dealer-search">Search dealers</label>
              <input
                id="dealer-search"
                type="text"
                value={dealerSearch}
                onChange={(e) => setDealerSearch(e.target.value)}
                placeholder="Search by company, contact, or location…"
                className="flex-1 min-w-[240px] bg-stone-900 border border-stone-700 text-cream px-3 py-2 font-body text-sm"
              />
              <label className="sr-only" htmlFor="dealer-stage-filter">Filter by stage</label>
              <select id="dealer-stage-filter" value={dealerStageFilter} onChange={(e) => setDealerStageFilter(e.target.value)}
                className="bg-stone-900 border border-stone-700 text-cream px-3 py-2 font-body text-sm">
                <option value="all">All stages</option>
                <option value="new">Pending</option>
                <option value="training">In Training</option>
                <option value="forms_pending">Forms Pending</option>
                <option value="pending_final_approval">Pending Final Approval</option>
                <option value="approved">Approved</option>
                <option value="authorized">Authorized</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

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
                    {visibleDealers.map((d) => {
                      const days = daysAgo(d.last_activity_at);
                      const isBottleneck = d.onboarding_stage !== "authorized" && d.onboarding_stage !== "inactive" && days > 7;
                      return (
                        <tr
                          key={d.dealer_id}
                          onClick={() => router.push(`/admin/dealers/${d.dealer_id}`)}
                          onKeyDown={(e) => {
                            // Keyboard activation parity with the click handler.
                            // <tr> isn't natively focusable, but with tabIndex={0}
                            // it can be — Enter follows the link, Space prevents
                            // default page-scroll then follows.
                            if (e.key === "Enter") { router.push(`/admin/dealers/${d.dealer_id}`); }
                            else if (e.key === " ") { e.preventDefault(); router.push(`/admin/dealers/${d.dealer_id}`); }
                          }}
                          tabIndex={0}
                          role="link"
                          aria-label={`Open ${d.company_name} dealer detail`}
                          className={`border-b border-stone-800 hover:bg-stone-800/50 focus:bg-stone-800/50 focus:outline-none focus:ring-1 focus:ring-gold transition-colors cursor-pointer ${isBottleneck ? "bg-red-950/20" : ""}`}
                        >
                          <td className="py-4 px-4 min-w-[180px]">
                            <p className="font-body font-semibold text-cream">{d.company_name}</p>
                            <p className="text-xs text-stone-500 font-body">{d.location || "—"} · Joined {formatDate(d.joined_date)}</p>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`text-xs uppercase tracking-wider px-2.5 py-0.5 font-bold ${
                              d.onboarding_stage === "authorized" ? "bg-green-900 text-green-100" :
                              d.onboarding_stage === "approved"   ? "bg-emerald-900 text-emerald-100 border border-emerald-700" :
                              d.onboarding_stage === "pending_final_approval" ? "bg-gold/20 text-gold border border-gold" :
                              d.onboarding_stage === "training"   ? "bg-amber-900 text-amber-100" :
                              d.onboarding_stage === "forms_pending" ? "bg-red-900 text-red-100" :
                              d.onboarding_stage === "inactive"   ? "bg-stone-900 text-stone-500 border border-stone-700" :
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
                            {d.forms_submitted > 0
                              ? <span className="text-green-400">✓ Submitted</span>
                              : <span className="text-amber-400">Pending</span>}
                          </td>
                          <td className="py-4 px-4 text-sm font-body">
                            <span className={days > 7 && d.onboarding_stage !== "authorized" ? "text-red-400 font-semibold" : "text-stone-300"}>
                              {!d.last_activity_at ? "Never" : days === 0 ? "Today" : `${days}d ago`}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {isBottleneck ? (
                              <p className="text-xs font-body text-red-400">Inactive {days}d</p>
                            ) : (
                              <span className="text-xs font-body text-stone-500">On track</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {visibleDealers.length === 0 && (<tr><td colSpan={6} className="py-8 text-center text-stone-500 font-body">{dealers.length === 0 ? "No dealers yet." : "No dealers match your filters."}</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "leads" && (
          <div>
            <div className="flex flex-wrap gap-3 mb-4 items-center">
              <label className="sr-only" htmlFor="lead-search">Search leads</label>
              <input
                id="lead-search"
                type="text"
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                placeholder="Search by project, company, customer, dealer, or city…"
                className="flex-1 min-w-[240px] bg-stone-900 border border-stone-700 text-cream px-3 py-2 font-body text-sm"
              />
              <label className="sr-only" htmlFor="lead-stage-filter">Filter by lead stage</label>
              <select id="lead-stage-filter" value={leadStageFilter} onChange={(e) => setLeadStageFilter(e.target.value)}
                className="bg-stone-900 border border-stone-700 text-cream px-3 py-2 font-body text-sm">
                <option value="all">All active stages</option>
                <option value="new">New</option>
                <option value="accepted">Accepted</option>
                <option value="bid_submitted">Bid Submitted</option>
              </select>
              <button onClick={() => setNewLeadOpen(true)} className="text-xs uppercase tracking-wider px-5 py-2.5 bg-gold text-ink hover:bg-gold/80 font-body font-bold transition-colors">+ New Lead</button>
            </div>

            {stalledLeadsCount > 0 && (
              <div className="mb-6 p-5 bg-gold/10 border-l-4 border-gold">
                <p className="eyebrow text-gold mb-2">Stalled Lead Alert</p>
                <h3 className="font-heading text-lg font-bold mb-2">{stalledLeadsCount} lead{stalledLeadsCount === 1 ? " is" : "s are"} stalled.</h3>
                <p className="font-body text-sm text-stone-300">No movement in 14+ days. Click any lead row to edit or delete.</p>
              </div>
            )}

            <div className="bg-stone-900 border border-stone-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-950 text-stone-400">
                    <tr className="border-b border-stone-800">
                      <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Project</th>
                      <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Customer</th>
                      <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Dealer</th>
                      <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Stage</th>
                      <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Bid Due</th>
                      <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-body font-bold">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleLeads.map((lead) => {
                      const days = daysAgo(lead.updated_at);
                      const stalled = days > 14;
                      return (
                        <tr
                          key={lead.id}
                          onClick={() => openEditLead(lead)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { openEditLead(lead); }
                            else if (e.key === " ") { e.preventDefault(); openEditLead(lead); }
                          }}
                          tabIndex={0}
                          role="button"
                          aria-label={`Edit lead ${lead.project_name || lead.homeowner_name || "unnamed"}`}
                          className={`border-b border-stone-800 hover:bg-stone-800/50 focus:bg-stone-800/50 focus:outline-none focus:ring-1 focus:ring-gold transition-colors cursor-pointer ${stalled ? "bg-gold/5" : ""}`}
                        >
                          <td className="py-4 px-4">
                            <p className="font-body font-semibold text-cream">{lead.project_name || "—"}</p>
                            {lead.contact_company && <p className="text-xs text-stone-500 font-body">{lead.contact_company}</p>}
                            {stalled && (<p className="text-xs text-gold font-body font-semibold uppercase tracking-wider mt-1">Stalled</p>)}
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-body text-sm text-cream">{lead.homeowner_name || "—"}</p>
                            <p className="text-xs text-stone-500 font-body capitalize">{lead.customer_type || "—"}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-body text-sm text-cream">{lead.dealers?.company_name || "—"}</p>
                            <p className="text-xs text-stone-500 font-body">{lead.dealers?.location || "—"}</p>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`text-xs uppercase tracking-wider px-2.5 py-0.5 font-bold ${
                              lead.stage === "new" ? "bg-gold text-ink" :
                              lead.stage === "accepted" ? "bg-blue-900 text-blue-100" :
                              lead.stage === "bid_submitted" ? "bg-amber-900 text-amber-100" :
                              lead.stage === "declined" ? "bg-amber-950 text-amber-200 border border-amber-700" :
                              "bg-stone-800 text-stone-300"
                            }`}>
                              {LEAD_STAGE_LABELS[lead.stage]}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm font-body">
                            {lead.bid_due_date ? (
                              <span className={daysAgo(lead.bid_due_date) > 0 ? "text-red-400 font-semibold" : "text-stone-300"}>
                                {formatDate(lead.bid_due_date)}
                              </span>
                            ) : <span className="text-stone-500">—</span>}
                          </td>
                          <td className="py-4 px-4 text-sm font-body">
                            <span className={days > 14 ? "text-red-400 font-semibold" : stalled ? "text-gold font-semibold" : "text-stone-300"}>{days}d ago</span>
                          </td>
                        </tr>
                      );
                    })}
                    {visibleLeads.length === 0 && (<tr><td colSpan={6} className="py-8 text-center text-stone-500 font-body">{leads.length === 0 ? "No active leads." : "No leads match your filters."}</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <NewLeadModal
        open={newLeadOpen}
        onClose={() => setNewLeadOpen(false)}
        onCreated={() => setRefreshKey((k) => k + 1)}
        dealers={dealers.map((d) => ({ dealer_id: d.dealer_id, company_name: d.company_name }))}
      />

      <EditLeadModal
        open={editingLead !== null}
        lead={editingLead}
        onClose={() => setEditingLead(null)}
        onSaved={() => setRefreshKey((k) => k + 1)}
        dealers={dealers.map((d) => ({ dealer_id: d.dealer_id, company_name: d.company_name }))}
      />
    </div>
  );
}
