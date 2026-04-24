"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Admin = { name: string; email: string; role: string };

type DealerStatus = {
  id: string;
  companyName: string;
  contactName: string;
  location: string;
  joinedDate: string;
  onboardingStage: "new" | "forms_pending" | "training" | "authorized";
  modulesComplete: number;
  modulesTotal: number;
  daysSinceLastActivity: number;
  formsSubmitted: number;
  formsTotal: number;
  hasBottleneck: boolean;
  bottleneckReason?: string;
};

type ActiveLead = {
  id: string;
  customer: string;
  dealerAssigned: string;
  dealerLocation: string;
  projectType: string;
  estimatedValue: number;
  daysInStage: number;
  stage: "new" | "contacted" | "bid_submitted" | "won" | "lost";
  stalled: boolean;
};

// Sample data based on Mike's slide deck mockup
const DEALER_STATUSES: DealerStatus[] = [
  {
    id: "d1",
    companyName: "Aldergrove Rails Ltd.",
    contactName: "Dealer 1",
    location: "Aldergrove, BC",
    joinedDate: "Apr 12, 2026",
    onboardingStage: "authorized",
    modulesComplete: 5,
    modulesTotal: 5,
    daysSinceLastActivity: 2,
    formsSubmitted: 2,
    formsTotal: 2,
    hasBottleneck: false,
  },
  {
    id: "d2",
    companyName: "Surrey Decking Co.",
    contactName: "Dealer 2",
    location: "Surrey, BC",
    joinedDate: "Apr 18, 2026",
    onboardingStage: "training",
    modulesComplete: 3,
    modulesTotal: 5,
    daysSinceLastActivity: 1,
    formsSubmitted: 2,
    formsTotal: 2,
    hasBottleneck: false,
  },
  {
    id: "d3",
    companyName: "Grand Forks Rail & Glass",
    contactName: "Derek P.",
    location: "Grand Forks, BC",
    joinedDate: "Apr 10, 2026",
    onboardingStage: "forms_pending",
    modulesComplete: 1,
    modulesTotal: 5,
    daysSinceLastActivity: 9,
    formsSubmitted: 1,
    formsTotal: 2,
    hasBottleneck: true,
    bottleneckReason: "Credit application pending 9 days",
  },
  {
    id: "d4",
    companyName: "Alpine Rails Inc.",
    contactName: "Darren M.",
    location: "Kelowna, BC",
    joinedDate: "Apr 3, 2026",
    onboardingStage: "training",
    modulesComplete: 2,
    modulesTotal: 5,
    daysSinceLastActivity: 12,
    formsSubmitted: 2,
    formsTotal: 2,
    hasBottleneck: true,
    bottleneckReason: "No training activity in 12 days",
  },
  {
    id: "d5",
    companyName: "Powell River Railings",
    contactName: "Dealer 5",
    location: "Powell River, BC",
    joinedDate: "Apr 20, 2026",
    onboardingStage: "new",
    modulesComplete: 0,
    modulesTotal: 5,
    daysSinceLastActivity: 0,
    formsSubmitted: 0,
    formsTotal: 2,
    hasBottleneck: false,
  },
  {
    id: "d6",
    companyName: "Modern Powell Co.",
    contactName: "Dealer 6",
    location: "Powell River, BC",
    joinedDate: "Apr 8, 2026",
    onboardingStage: "authorized",
    modulesComplete: 5,
    modulesTotal: 5,
    daysSinceLastActivity: 0,
    formsSubmitted: 2,
    formsTotal: 2,
    hasBottleneck: false,
  },
  {
    id: "d7",
    companyName: "Langley Railcraft",
    contactName: "Dealer 7",
    location: "Langley, BC",
    joinedDate: "Apr 15, 2026",
    onboardingStage: "training",
    modulesComplete: 4,
    modulesTotal: 5,
    daysSinceLastActivity: 3,
    formsSubmitted: 2,
    formsTotal: 2,
    hasBottleneck: false,
  },
];

const ACTIVE_LEADS: ActiveLead[] = [
  {
    id: "l1",
    customer: "Jim Smith",
    dealerAssigned: "Surrey Decking Co.",
    dealerLocation: "Surrey, BC",
    projectType: "Backyard deck — 80 LF Infinity",
    estimatedValue: 12000,
    daysInStage: 2,
    stage: "new",
    stalled: false,
  },
  {
    id: "l2",
    customer: "Sarah Liu",
    dealerAssigned: "Langley Railcraft",
    dealerLocation: "Langley, BC",
    projectType: "Front porch — 32 LF Picket",
    estimatedValue: 4800,
    daysInStage: 4,
    stage: "contacted",
    stalled: false,
  },
  {
    id: "l3",
    customer: "Mike Chen",
    dealerAssigned: "Aldergrove Rails Ltd.",
    dealerLocation: "Aldergrove, BC",
    projectType: "Pool surround — 120 LF Infinity",
    estimatedValue: 18500,
    daysInStage: 6,
    stage: "bid_submitted",
    stalled: false,
  },
  {
    id: "l4",
    customer: "Heritage Homes",
    dealerAssigned: "Modern Powell Co.",
    dealerLocation: "Powell River, BC",
    projectType: "Multi-family — 840 LF Picket",
    estimatedValue: 67200,
    daysInStage: 18,
    stage: "bid_submitted",
    stalled: true,
  },
  {
    id: "l5",
    customer: "Davidson Residence",
    dealerAssigned: "Grand Forks Rail & Glass",
    dealerLocation: "Grand Forks, BC",
    projectType: "Custom deck — 56 LF Glass",
    estimatedValue: 8400,
    daysInStage: 22,
    stage: "new",
    stalled: true,
  },
];

const STAGE_LABELS: Record<DealerStatus["onboardingStage"], string> = {
  new: "New",
  forms_pending: "Forms Pending",
  training: "Training",
  authorized: "Authorized",
};

const LEAD_STAGE_LABELS: Record<ActiveLead["stage"], string> = {
  new: "New",
  contacted: "Contacted",
  bid_submitted: "Bid Submitted",
  won: "Won",
  lost: "Lost",
};

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"onboarding" | "leads">("onboarding");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("ias_admin") : null;
    if (!stored) { router.push("/admin/login"); return; }
    try {
      setAdmin(JSON.parse(stored));
    } catch { router.push("/admin/login"); return; }
    setLoading(false);
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("ias_admin");
    router.push("/admin/login");
  }

  if (loading || !admin) {
    return <div className="section-container section-padding"><p className="text-stone-600">Loading...</p></div>;
  }

  // Calculated stats
  const totalDealers = DEALER_STATUSES.length;
  const authorizedCount = DEALER_STATUSES.filter((d) => d.onboardingStage === "authorized").length;
  const inOnboardingCount = DEALER_STATUSES.filter((d) => d.onboardingStage !== "authorized").length;
  const bottleneckCount = DEALER_STATUSES.filter((d) => d.hasBottleneck).length;

  const activeLeadsCount = ACTIVE_LEADS.length;
  const stalledLeadsCount = ACTIVE_LEADS.filter((l) => l.stalled).length;
  const totalPipelineValue = ACTIVE_LEADS.reduce((sum, l) => sum + l.estimatedValue, 0);
  const stalledPipelineValue = ACTIVE_LEADS.filter((l) => l.stalled).reduce((sum, l) => sum + l.estimatedValue, 0);

  return (
    <div className="bg-ink min-h-screen text-cream">
      {/* Admin header */}
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
              <span className="ml-2 font-semibold">{admin.name}</span>
            </p>
            <button onClick={handleLogout} className="text-xs font-body uppercase tracking-wider border border-stone-700 hover:border-gold hover:text-gold px-4 py-2 transition-colors">
              Log Out
            </button>
          </div>
        </div>
      </div>

      <div className="section-container section-padding">
        {/* Page title */}
        <div className="mb-10">
          <p className="eyebrow text-gold mb-2">Control Tower</p>
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-2">Ecosystem Overview</h2>
          <p className="font-body text-stone-400 max-w-2xl">
            Real-time visibility into dealer onboarding, active leads, and pipeline health. Identify bottlenecks and stalled deals before they become problems.
          </p>
        </div>

        {/* Top-level stats */}
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
            <p className="text-xs text-stone-500 font-body mt-1">{activeLeadsCount} active leads</p>
          </div>
          <div className="bg-stone-900 border border-stone-800 p-5">
            <p className="eyebrow text-stone-500 mb-2">Stalled Value</p>
            <p className="text-3xl font-heading font-bold text-gold">${(stalledPipelineValue / 1000).toFixed(1)}K</p>
            <p className="text-xs text-red-400 font-body font-semibold uppercase tracking-wider mt-1">{stalledLeadsCount} need attention</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-stone-800">
          <button
            onClick={() => setActiveTab("onboarding")}
            className={`px-6 py-4 text-xs font-body font-bold uppercase tracking-widest border-b-2 transition-colors ${
              activeTab === "onboarding"
                ? "border-gold text-cream"
                : "border-transparent text-stone-500 hover:text-cream"
            }`}
          >
            Onboarding Monitor ({totalDealers})
          </button>
          <button
            onClick={() => setActiveTab("leads")}
            className={`px-6 py-4 text-xs font-body font-bold uppercase tracking-widest border-b-2 transition-colors ${
              activeTab === "leads"
                ? "border-gold text-cream"
                : "border-transparent text-stone-500 hover:text-cream"
            }`}
          >
            Lead Hopper ({activeLeadsCount})
          </button>
        </div>

        {/* ONBOARDING MONITOR TAB */}
        {activeTab === "onboarding" && (
          <div>
            {/* Bottleneck alerts row */}
            {bottleneckCount > 0 && (
              <div className="mb-6 p-5 bg-red-950/30 border-l-4 border-red-500">
                <p className="eyebrow text-red-400 mb-2">Bottleneck Alert</p>
                <h3 className="font-heading text-lg font-bold mb-2">{bottleneckCount} dealer{bottleneckCount === 1 ? " is" : "s are"} stuck in onboarding.</h3>
                <p className="font-body text-sm text-stone-300">
                  Consider reaching out personally or offering a training session. Stalled onboarding often becomes abandoned onboarding.
                </p>
              </div>
            )}

            {/* Dealer table */}
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
                    {DEALER_STATUSES.map((dealer) => (
                      <tr key={dealer.id} className={`border-b border-stone-800 hover:bg-stone-800/50 transition-colors ${dealer.hasBottleneck ? "bg-red-950/20" : ""}`}>
                        <td className="py-4 px-4">
                          <p className="font-body font-semibold text-cream">{dealer.companyName}</p>
                          <p className="text-xs text-stone-500 font-body">{dealer.location} · Joined {dealer.joinedDate}</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-xs uppercase tracking-wider px-2.5 py-0.5 font-bold ${
                            dealer.onboardingStage === "authorized"
                              ? "bg-green-900 text-green-100"
                              : dealer.onboardingStage === "training"
                              ? "bg-amber-900 text-amber-100"
                              : dealer.onboardingStage === "forms_pending"
                              ? "bg-red-900 text-red-100"
                              : "bg-stone-800 text-stone-300"
                          }`}>
                            {STAGE_LABELS[dealer.onboardingStage]}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-stone-800 h-1.5 overflow-hidden">
                              <div className="h-full bg-gold" style={{ width: `${(dealer.modulesComplete / dealer.modulesTotal) * 100}%` }}></div>
                            </div>
                            <span className="text-xs font-body text-stone-400">{dealer.modulesComplete}/{dealer.modulesTotal}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm font-body">
                          <span className={dealer.formsSubmitted === dealer.formsTotal ? "text-green-400" : "text-amber-400"}>
                            {dealer.formsSubmitted}/{dealer.formsTotal}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm font-body">
                          <span className={dealer.daysSinceLastActivity > 7 ? "text-red-400 font-semibold" : "text-stone-300"}>
                            {dealer.daysSinceLastActivity === 0 ? "Today" : `${dealer.daysSinceLastActivity}d ago`}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {dealer.hasBottleneck ? (
                            <div className="flex items-center gap-2">
                              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="text-red-500 flex-shrink-0">
                                <path d="M10 2L18 17H2L10 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                                <path d="M10 8V11M10 13.5V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              </svg>
                              <p className="text-xs font-body text-red-400">{dealer.bottleneckReason}</p>
                            </div>
                          ) : (
                            <span className="text-xs font-body text-stone-500">On track</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* LEAD HOPPER TAB */}
        {activeTab === "leads" && (
          <div>
            {stalledLeadsCount > 0 && (
              <div className="mb-6 p-5 bg-gold/10 border-l-4 border-gold">
                <p className="eyebrow text-gold mb-2">Stalled Lead Alert</p>
                <h3 className="font-heading text-lg font-bold mb-2">
                  {stalledLeadsCount} lead{stalledLeadsCount === 1 ? " is" : "s are"} stalled — ${stalledPipelineValue.toLocaleString()} at risk.
                </h3>
                <p className="font-body text-sm text-stone-300">
                  Special Ops opportunity: these high-value bids may benefit from targeted presentation support or direct builder outreach.
                </p>
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
                    {ACTIVE_LEADS.map((lead) => (
                      <tr key={lead.id} className={`border-b border-stone-800 hover:bg-stone-800/50 transition-colors ${lead.stalled ? "bg-gold/5" : ""}`}>
                        <td className="py-4 px-4">
                          <p className="font-body font-semibold text-cream">{lead.customer}</p>
                          {lead.stalled && (
                            <p className="text-xs text-gold font-body font-semibold uppercase tracking-wider mt-1">Stalled</p>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-body text-sm text-cream">{lead.dealerAssigned}</p>
                          <p className="text-xs text-stone-500 font-body">{lead.dealerLocation}</p>
                        </td>
                        <td className="py-4 px-4 text-sm font-body text-stone-300">{lead.projectType}</td>
                        <td className="py-4 px-4">
                          <span className={`text-xs uppercase tracking-wider px-2.5 py-0.5 font-bold ${
                            lead.stage === "new" ? "bg-gold text-ink" :
                            lead.stage === "contacted" ? "bg-blue-900 text-blue-100" :
                            lead.stage === "bid_submitted" ? "bg-amber-900 text-amber-100" :
                            lead.stage === "won" ? "bg-green-900 text-green-100" :
                            "bg-stone-800 text-stone-300"
                          }`}>
                            {LEAD_STAGE_LABELS[lead.stage]}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm font-body">
                          <span className={lead.daysInStage > 14 ? "text-red-400 font-semibold" : lead.stalled ? "text-gold font-semibold" : "text-stone-300"}>
                            {lead.daysInStage}d
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-heading font-bold text-cream">${lead.estimatedValue.toLocaleString()}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Footer note */}
        <div className="mt-12 p-6 border border-stone-800 bg-stone-950">
          <div className="flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gold flex-shrink-0 mt-0.5" aria-hidden="true">
              <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10 6V10.5M10 13V13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div>
              <p className="font-body text-sm text-stone-300 leading-relaxed">
                <span className="font-semibold text-cream">Demo Preview.</span>{" "}
                This admin dashboard demonstrates the Phase 2 "Control Tower" concept from the strategic deck. In production, data updates in real-time from the dealer portal, lead management system, and training progress tracking. Bottleneck alerts and stalled lead notifications are triggered automatically based on configurable SLA thresholds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
