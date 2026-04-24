"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Dealer = { name: string; email: string };

const TRAINING_TOTAL = 5;

// ---------- THEMES ----------
type ThemeId = "editorial" | "midnight" | "platinum" | "carbon";

type Theme = {
  id: ThemeId;
  name: string;
  description: string;
  swatch: string; // color shown in switcher
  // Core colors
  bg: string;
  bgAlt: string; // for the cream-dark tiles (Account row)
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  divider: string;
  // Accents
  gold: string;
  goldFill: string;
  // Tool tile (dark tile, high-contrast)
  toolBg: string;
  toolText: string;
  toolEyebrow: string;
  toolHoverBg: string;
  toolHoverText: string;
  // Activity cards
  cardBg: string;
  cardBorder: string;
  cardBorderHover: string;
  // Logout button
  logoutBorder: string;
  logoutText: string;
  logoutHoverBg: string;
};

const THEMES: Theme[] = [
  {
    id: "editorial",
    name: "Editorial",
    description: "Current brand. Cream, gold, ink.",
    swatch: "#F9F6F0",
    bg: "#F9F6F0",
    bgAlt: "#EFEAE0",
    textPrimary: "#0A0908",
    textSecondary: "#57534E",
    textMuted: "#A8A29E",
    divider: "#E7E5E4",
    gold: "#B69A5A",
    goldFill: "#D4B975",
    toolBg: "#0A0908",
    toolText: "#F9F6F0",
    toolEyebrow: "#B69A5A",
    toolHoverBg: "#B69A5A",
    toolHoverText: "#0A0908",
    cardBg: "#FFFFFF",
    cardBorder: "#E7E5E4",
    cardBorderHover: "#A8A29E",
    logoutBorder: "#0A0908",
    logoutText: "#0A0908",
    logoutHoverBg: "#0A0908",
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Dark mode. High contrast, gold accents.",
    swatch: "#0A0908",
    bg: "#0A0908",
    bgAlt: "#1A1918",
    textPrimary: "#F9F6F0",
    textSecondary: "#A8A29E",
    textMuted: "#57534E",
    divider: "#2A2928",
    gold: "#D4B975",
    goldFill: "#E5CB8A",
    toolBg: "#1A1918",
    toolText: "#F9F6F0",
    toolEyebrow: "#D4B975",
    toolHoverBg: "#D4B975",
    toolHoverText: "#0A0908",
    cardBg: "#1A1918",
    cardBorder: "#2A2928",
    cardBorderHover: "#D4B975",
    logoutBorder: "#F9F6F0",
    logoutText: "#F9F6F0",
    logoutHoverBg: "#F9F6F0",
  },
  {
    id: "platinum",
    name: "Platinum",
    description: "Ultra clean. White, charcoal, gold.",
    swatch: "#F5F5F5",
    bg: "#FAFAFA",
    bgAlt: "#F0F0F0",
    textPrimary: "#1A1A1A",
    textSecondary: "#525252",
    textMuted: "#A3A3A3",
    divider: "#E5E5E5",
    gold: "#B69A5A",
    goldFill: "#C9AE6E",
    toolBg: "#1A1A1A",
    toolText: "#FAFAFA",
    toolEyebrow: "#B69A5A",
    toolHoverBg: "#B69A5A",
    toolHoverText: "#1A1A1A",
    cardBg: "#FFFFFF",
    cardBorder: "#E5E5E5",
    cardBorderHover: "#1A1A1A",
    logoutBorder: "#1A1A1A",
    logoutText: "#1A1A1A",
    logoutHoverBg: "#1A1A1A",
  },
  {
    id: "carbon",
    name: "Carbon",
    description: "Deep blue-black. High-tech, aggressive.",
    swatch: "#0B111D",
    bg: "#0B111D",
    bgAlt: "#141C2D",
    textPrimary: "#E8EEF5",
    textSecondary: "#8A94A6",
    textMuted: "#4A5568",
    divider: "#1E2838",
    gold: "#D4B975",
    goldFill: "#EACE8A",
    toolBg: "#141C2D",
    toolText: "#E8EEF5",
    toolEyebrow: "#D4B975",
    toolHoverBg: "#D4B975",
    toolHoverText: "#0B111D",
    cardBg: "#141C2D",
    cardBorder: "#1E2838",
    cardBorderHover: "#D4B975",
    logoutBorder: "#E8EEF5",
    logoutText: "#E8EEF5",
    logoutHoverBg: "#E8EEF5",
  },
];

// Animated counter hook
function useCountUp(target: number, duration: number = 1200, enabled: boolean = true): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    if (target === 0) { setValue(0); return; }

    const startTime = performance.now();
    let rafId: number;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration, enabled]);

  return value;
}

// Hexagon badge — uses theme gold
function AuthorizedBadge({ authorized, progress, theme }: { authorized: boolean; progress: number; theme: Theme }) {
  const fillPercent = authorized ? 100 : progress * 100;
  const emptyStroke = theme.divider;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: 96, height: 108 }}>
      <svg width="96" height="108" viewBox="0 0 96 108" className="absolute inset-0">
        <defs>
          <linearGradient id="badgeFill" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={theme.gold} />
            <stop offset="100%" stopColor={theme.goldFill} />
          </linearGradient>
          <clipPath id="hexClip">
            <polygon points="48,4 88,28 88,80 48,104 8,80 8,28" />
          </clipPath>
        </defs>
        <polygon
          points="48,4 88,28 88,80 48,104 8,80 8,28"
          fill="none"
          stroke={authorized ? theme.gold : emptyStroke}
          strokeWidth="2"
        />
        <g clipPath="url(#hexClip)">
          <rect
            x="0"
            y={108 - (108 * fillPercent) / 100}
            width="96"
            height={(108 * fillPercent) / 100}
            fill="url(#badgeFill)"
            style={{ transition: "all 1s ease-out" }}
          />
        </g>
        <polygon
          points="48,14 78,32 78,76 48,94 18,76 18,32"
          fill="none"
          stroke={authorized ? "#FFFFFF" : "transparent"}
          strokeWidth="1"
          opacity="0.4"
        />
      </svg>

      <div className="relative z-10 flex flex-col items-center justify-center">
        {authorized ? (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M12 21L18 27L28 15" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none" style={{ color: theme.textMuted }}>
            <rect x="13" y="18" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="2" />
            <path d="M16 18V14a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </div>
    </div>
  );
}

// Theme Switcher — floating bottom-right
function ThemeSwitcher({ current, onChange }: { current: ThemeId; onChange: (id: ThemeId) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className="bg-white shadow-2xl border border-stone-200">
        {expanded && (
          <div className="px-5 pt-4 pb-2 border-b border-stone-200">
            <p className="text-[10px] font-body font-bold uppercase tracking-widest text-stone-500 mb-1">Demo Preview</p>
            <p className="text-xs font-body text-stone-700">Try different color schemes. For Mike &amp; Fred feedback only.</p>
          </div>
        )}
        <div className="flex items-center gap-3 p-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => { onChange(t.id); setExpanded(true); }}
              onMouseEnter={() => setExpanded(true)}
              className={`group relative w-10 h-10 border-2 transition-all flex items-center justify-center ${
                current === t.id ? "border-stone-900 scale-110" : "border-stone-300 hover:border-stone-500"
              }`}
              style={{ background: t.swatch }}
              title={t.name}
            >
              {current === t.id && (
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M5 10L9 14L15 6"
                    stroke={t.id === "editorial" || t.id === "platinum" ? "#0A0908" : "#F9F6F0"}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          ))}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-stone-400 hover:text-stone-700 text-xs font-body uppercase tracking-wider ml-1"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? "−" : "+"}
          </button>
        </div>
        {expanded && (
          <div className="px-5 pb-3">
            <p className="text-xs font-body text-stone-600">
              <span className="font-semibold text-ink">{THEMES.find(t => t.id === current)?.name}</span>
              {" — "}
              {THEMES.find(t => t.id === current)?.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [animationsReady, setAnimationsReady] = useState(false);
  const [themeId, setThemeId] = useState<ThemeId>("editorial");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("ias_dealer") : null;
    if (!stored) { router.push("/dealers/login"); return; }
    let parsedDealer: Dealer;
    try {
      parsedDealer = JSON.parse(stored);
      setDealer(parsedDealer);
    } catch { router.push("/dealers/login"); return; }

    const progressKey = `ias_training_progress_${parsedDealer.email}`;
    const storedProgress = localStorage.getItem(progressKey);
    if (storedProgress) {
      try {
        const parsed = JSON.parse(storedProgress);
        setCompletedCount(Array.isArray(parsed) ? parsed.length : 0);
      } catch {}
    }

    // Load saved theme preference
    const savedTheme = localStorage.getItem("ias_dashboard_theme");
    if (savedTheme && THEMES.find(t => t.id === savedTheme)) {
      setThemeId(savedTheme as ThemeId);
    }

    setLoading(false);
    setTimeout(() => setAnimationsReady(true), 150);
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("ias_dealer");
    router.push("/dealers/login");
  }

  function handleThemeChange(newThemeId: ThemeId) {
    setThemeId(newThemeId);
    localStorage.setItem("ias_dashboard_theme", newThemeId);
  }

  const trainingAnimated = useCountUp(completedCount, 900, animationsReady);
  const leadsAnimated = useCountUp(3, 1000, animationsReady);
  const quotesAnimated = useCountUp(7, 1100, animationsReady);
  const quoteValueAnimated = useCountUp(84250, 1400, animationsReady);

  if (loading || !dealer) {
    return <div className="section-container section-padding"><p className="text-stone-600">Loading...</p></div>;
  }

  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const trainingPercent = (completedCount / TRAINING_TOTAL) * 100;
  const isAuthorized = completedCount === TRAINING_TOTAL;

  return (
    <div style={{ background: theme.bg, color: theme.textPrimary, transition: "background 0.4s, color 0.4s" }}>
      <div className="section-container section-padding">
        {/* HERO */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 mb-6">
            <div className="flex-1 flex items-start gap-6">
              <div className="hidden sm:block flex-shrink-0 pt-1">
                <AuthorizedBadge authorized={isAuthorized} progress={trainingPercent / 100} theme={theme} />
                <p
                  className="text-[10px] font-body font-bold uppercase tracking-widest text-center mt-2"
                  style={{ color: theme.textMuted }}
                >
                  {isAuthorized ? "Authorized Partner" : "In Training"}
                </p>
              </div>
              <div className="flex-1">
                <p className="eyebrow mb-3" style={{ color: theme.gold }}>Dealer Portal</p>
                <h1 className="text-4xl md:text-5xl font-heading font-bold mb-2" style={{ color: theme.textPrimary }}>
                  Welcome back, {dealer.name}.
                </h1>
                <p className="font-body" style={{ color: theme.textSecondary }}>
                  {isAuthorized
                    ? "Authorized Dealer · Full access to all tools and programs."
                    : `Complete ${TRAINING_TOTAL - completedCount} more module${TRAINING_TOTAL - completedCount === 1 ? "" : "s"} to unlock authorized partner status.`}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex-shrink-0 self-start px-6 py-3 text-xs font-body font-bold uppercase tracking-widest border-2 transition-colors"
              style={{
                borderColor: theme.logoutBorder,
                color: theme.logoutText,
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.logoutHoverBg;
                e.currentTarget.style.color = theme.bg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = theme.logoutText;
              }}
            >
              Log Out
            </button>
          </div>

          {!isAuthorized && (
            <div className="pt-6" style={{ borderTop: `1px solid ${theme.divider}` }}>
              <div className="flex items-center justify-between mb-3">
                <p className="eyebrow" style={{ color: theme.textMuted }}>Your Path to Authorized Partner</p>
                <p className="text-sm font-body font-semibold">
                  <span style={{ color: theme.textPrimary }}>{completedCount}</span>
                  <span style={{ color: theme.textMuted }}> / {TRAINING_TOTAL} modules</span>
                </p>
              </div>
              <div className="relative w-full h-2 overflow-hidden" style={{ background: theme.divider }}>
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-1500 ease-out"
                  style={{ width: animationsReady ? `${trainingPercent}%` : "0%", background: theme.gold }}
                ></div>
              </div>
            </div>
          )}

          {isAuthorized && (
            <div className="pt-6" style={{ borderTop: `1px solid ${theme.divider}` }}>
              <div className="flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="10" fill={theme.gold} />
                  <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="font-body text-sm font-semibold" style={{ color: theme.textPrimary }}>
                  All 5 training modules complete. You are a certified Authorized Partner.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* TOOLS */}
        <div className="mb-10">
          <div className="flex items-baseline justify-between mb-5">
            <p className="eyebrow" style={{ color: theme.textMuted }}>Tools</p>
            <p className="text-xs font-body" style={{ color: theme.textMuted }}>Open and use any time</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { href: "/dealers/tools/calculator", eyebrow: "Pricing", title: "Calculator", subtitle: "Live pricing for Infinity systems.", external: false },
              { href: "/dealers/tools/order-sheets", eyebrow: "Catalog", title: "Order Sheets", subtitle: "Full product catalog and order builder.", external: false },
              { href: "https://designer.innovativealuminum.com", eyebrow: "Visualize", title: "Designer", subtitle: "3D project visualizer ↗", external: true },
            ].map((t) => {
              const [isHover, setIsHover] = [false, () => {}]; // pseudo - we rely on CSS
              const Component: any = t.external ? "a" : Link;
              const props: any = t.external ? { href: t.href, target: "_blank", rel: "noopener noreferrer" } : { href: t.href };
              return (
                <Component
                  key={t.title}
                  {...props}
                  className="group block p-7 transition-colors duration-200 relative"
                  style={{ background: theme.toolBg, color: theme.toolText }}
                  onMouseEnter={(e: any) => {
                    e.currentTarget.style.background = theme.toolHoverBg;
                    e.currentTarget.style.color = theme.toolHoverText;
                  }}
                  onMouseLeave={(e: any) => {
                    e.currentTarget.style.background = theme.toolBg;
                    e.currentTarget.style.color = theme.toolText;
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <p className="eyebrow" style={{ color: "currentColor" }}>
                      <span className="group-hover:!text-current" style={{ color: theme.toolEyebrow }}>{t.eyebrow}</span>
                    </p>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: theme.toolEyebrow }}>
                      <path d={t.external ? "M11 3H17V9M9 11L17 3M9 17H3V11" : "M5 15L15 5M15 5H7M15 5V13"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="font-heading text-2xl font-bold mb-2">{t.title}</h3>
                  <p className="font-body text-sm opacity-80">{t.subtitle}</p>
                </Component>
              );
            })}
          </div>
        </div>

        {/* ACCOUNT */}
        <div className="mb-16">
          <p className="eyebrow mb-5" style={{ color: theme.textMuted }}>Your Account</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { href: "/dealers/training", eyebrow: "Program", title: "Training", subtitle: `${completedCount} of ${TRAINING_TOTAL} modules complete`, showCheck: isAuthorized },
              { href: "/dealers/leads", eyebrow: "Pipeline", title: "Leads", subtitle: "Customer leads from IAS." },
              { href: "/dealers/resources", eyebrow: "Library", title: "Dealer Resources", subtitle: "Installation guides and documents." },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group block p-6 transition-colors duration-200"
                style={{ background: theme.bgAlt, color: theme.textPrimary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.gold;
                  e.currentTarget.style.color = "#0A0908";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = theme.bgAlt;
                  e.currentTarget.style.color = theme.textPrimary;
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="eyebrow" style={{ color: theme.gold }}>{item.eyebrow}</p>
                  {item.showCheck && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="10" fill={theme.gold} />
                      <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <h3 className="font-heading text-xl font-bold mb-2">{item.title}</h3>
                <p className="font-body text-sm" style={{ color: theme.textSecondary }}>{item.subtitle}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Analytics */}
        <div className="pt-16" style={{ borderTop: `1px solid ${theme.divider}` }}>
          <p className="eyebrow mb-8" style={{ color: theme.textMuted }}>Your Activity</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {/* Training */}
            <div
              className="p-8 transition-colors"
              style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
            >
              <h3 className="font-heading text-xl font-bold mb-4" style={{ color: theme.textPrimary }}>Training Progress</h3>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-5xl font-heading font-bold tabular-nums" style={{ color: theme.textPrimary }}>{trainingAnimated}</span>
                <span className="mb-2" style={{ color: theme.textMuted }}>of {TRAINING_TOTAL} modules</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden mb-4" style={{ background: theme.divider }}>
                <div className="h-full transition-all duration-1000 ease-out" style={{ width: animationsReady ? `${trainingPercent}%` : "0%", background: theme.gold }}></div>
              </div>
              <Link href="/dealers/training" className="text-sm font-body font-semibold uppercase tracking-wider" style={{ color: theme.gold }}>
                {isAuthorized ? "Review Training →" : "Continue Training →"}
              </Link>
            </div>

            {/* Leads */}
            <div className="p-8" style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
              <h3 className="font-heading text-xl font-bold mb-4" style={{ color: theme.textPrimary }}>Leads</h3>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-5xl font-heading font-bold tabular-nums" style={{ color: theme.textPrimary }}>{leadsAnimated}</span>
                <span className="mb-2" style={{ color: theme.textMuted }}>this month</span>
              </div>
              <div className="text-sm font-body mb-4" style={{ color: theme.textSecondary }}>Leads sent to you from IAS.</div>
              <Link href="/dealers/leads" className="text-sm font-body font-semibold uppercase tracking-wider" style={{ color: theme.gold }}>
                View Leads →
              </Link>
            </div>

            {/* Quotes */}
            <div className="p-8" style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
              <h3 className="font-heading text-xl font-bold mb-4" style={{ color: theme.textPrimary }}>Recent Quotes</h3>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-5xl font-heading font-bold tabular-nums" style={{ color: theme.textPrimary }}>{quotesAnimated}</span>
                <span className="mb-2" style={{ color: theme.textMuted }}>last 30 days</span>
              </div>
              <div className="text-sm font-body mb-4" style={{ color: theme.textSecondary }}>
                Total value: <span className="font-semibold tabular-nums" style={{ color: theme.textPrimary }}>${quoteValueAnimated.toLocaleString()}</span>
              </div>
              <Link href="/dealers/tools/calculator" className="text-sm font-body font-semibold uppercase tracking-wider" style={{ color: theme.gold }}>
                New Quote →
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="font-heading text-xl font-bold mb-6" style={{ color: theme.textPrimary }}>Recent Leads</h3>
              <div className="space-y-4">
                {[
                  { customer: "Jim Smith", project: "Backyard deck — 80 LF", date: "Apr 22", status: "New" },
                  { customer: "Sarah Liu", project: "Front porch — 32 LF", date: "Apr 20", status: "Contacted" },
                  { customer: "Mike Chen", project: "Pool surround — 120 LF", date: "Apr 18", status: "Quoted" },
                ].map((lead) => (
                  <div key={lead.customer} className="flex justify-between items-center pb-4" style={{ borderBottom: `1px solid ${theme.divider}` }}>
                    <div>
                      <p className="font-body font-semibold" style={{ color: theme.textPrimary }}>{lead.customer}</p>
                      <p className="text-sm" style={{ color: theme.textSecondary }}>{lead.project}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: theme.gold }}>{lead.status}</p>
                      <p className="text-xs" style={{ color: theme.textMuted }}>{lead.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-heading text-xl font-bold mb-6" style={{ color: theme.textPrimary }}>News &amp; Announcements</h3>
              <div className="space-y-4">
                <div className="pb-4" style={{ borderBottom: `1px solid ${theme.divider}` }}>
                  <p className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: theme.gold }}>New Product</p>
                  <p className="font-body font-semibold mb-1" style={{ color: theme.textPrimary }}>Infinity Topless 2026 pricing now live</p>
                  <p className="text-sm" style={{ color: theme.textSecondary }}>Updated US/Canada pricing reflects tariff adjustments. Calculator updated.</p>
                </div>
                <div className="pb-4" style={{ borderBottom: `1px solid ${theme.divider}` }}>
                  <p className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: theme.gold }}>Training</p>
                  <p className="font-body font-semibold mb-1" style={{ color: theme.textPrimary }}>New installation video — Fascia mount</p>
                  <p className="text-sm" style={{ color: theme.textSecondary }}>Watch the latest training to maintain authorized status.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Theme switcher — fixed bottom-right */}
      <ThemeSwitcher current={themeId} onChange={handleThemeChange} />
    </div>
  );
}
