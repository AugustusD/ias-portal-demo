"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Dealer = { name: string; email: string };

type ResourceDoc = {
  name: string;
  description: string;
  category: "onboarding" | "installation" | "reference";
  url: string;
  tags: string[]; // helps with search
};

const RESOURCES: ResourceDoc[] = [
  {
    name: "New Customer Form",
    description: "Initial dealer application form. Complete and return to get started with IAS.",
    category: "onboarding",
    url: "/documents/new-customer-form.pdf",
    tags: ["customer form", "dealer", "application", "signup", "new"],
  },
  {
    name: "Credit Application",
    description: "Apply for net-30 terms with IAS. Required for credit-based purchasing.",
    category: "onboarding",
    url: "/documents/credit-application.pdf",
    tags: ["credit", "net-30", "terms", "application", "finance"],
  },
  {
    name: "Infinity Fascia Installation Guide",
    description: "Step-by-step installation guide for fascia mount Infinity Topless railing systems.",
    category: "installation",
    url: "/documents/InfinityInstallationGuideFascia.pdf",
    tags: ["infinity", "fascia", "topless", "glass", "install"],
  },
  {
    name: "Infinity Surface Installation Guide",
    description: "Step-by-step installation guide for surface mount Infinity Topless railing systems.",
    category: "installation",
    url: "/documents/InfinityInstallationGuideSurface.pdf",
    tags: ["infinity", "surface", "topless", "glass", "install"],
  },
  {
    name: "Wall Track Installation Guide",
    description: "Complete wall track installation reference for all applicable systems.",
    category: "installation",
    url: "/documents/InstallationGuideWallTrackComplete.pdf",
    tags: ["wall track", "mount", "install"],
  },
  {
    name: "Flex Rail Installation Guide",
    description: "Installation reference for flex rail applications.",
    category: "installation",
    url: "/documents/Installation_Guide-Flex_Rail.pdf",
    tags: ["flex rail", "install", "rail"],
  },
  {
    name: "Glass Installation Reference",
    description: "Glass measurement, ordering, and installation guide.",
    category: "reference",
    url: "/documents/installation_glass.pdf",
    tags: ["glass", "measurement", "install", "component"],
  },
  {
    name: "Picket Installation Reference",
    description: "Picket railing installation specifics for welded and modular picket systems.",
    category: "reference",
    url: "/documents/installation_picket.pdf",
    tags: ["picket", "welded", "install", "rail"],
  },
  {
    name: "Stairs Installation Reference",
    description: "Stair railing installation guide for sloped applications.",
    category: "reference",
    url: "/documents/installation_stairs.pdf",
    tags: ["stairs", "sloped", "install", "rail"],
  },
];

const CATEGORY_LABELS: Record<ResourceDoc["category"], string> = {
  onboarding: "Onboarding",
  installation: "Installation",
  reference: "Reference",
};

export default function DealerResourcesPage() {
  const router = useRouter();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<"all" | ResourceDoc["category"]>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("ias_dealer") : null;
    if (!stored) { router.push("/dealers/login"); return; }
    try {
      setDealer(JSON.parse(stored));
    } catch { router.push("/dealers/login"); return; }
    setLoading(false);
  }, [router]);

  // Filter by category + search
  const filteredResources = useMemo(() => {
    let result = RESOURCES;

    // Category filter
    if (activeCategory !== "all") {
      result = result.filter((r) => r.category === activeCategory);
    }

    // Search filter (name, description, tags)
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((r) => {
        const haystack = [
          r.name.toLowerCase(),
          r.description.toLowerCase(),
          ...r.tags.map((t) => t.toLowerCase()),
        ].join(" ");
        return haystack.includes(query);
      });
    }

    return result;
  }, [activeCategory, searchQuery]);

  // Category counts (for tab labels)
  const categoryCounts = useMemo(() => ({
    all: RESOURCES.length,
    onboarding: RESOURCES.filter((r) => r.category === "onboarding").length,
    installation: RESOURCES.filter((r) => r.category === "installation").length,
    reference: RESOURCES.filter((r) => r.category === "reference").length,
  }), []);

  if (loading || !dealer) {
    return <div className="section-container section-padding"><p className="text-stone-600">Loading...</p></div>;
  }

  return (
    <div className="bg-cream min-h-screen">
      <div className="sticky top-0 z-30 bg-cream border-b border-stone-200">
        <div className="section-container py-5">
          <div className="flex items-center gap-4">
            <Link href="/dealers/dashboard" className="text-sm font-body text-stone-600 hover:text-ink transition-colors">← Dashboard</Link>
            <span className="text-stone-300">/</span>
            <p className="eyebrow text-stone-600">Dealer Resources</p>
          </div>
        </div>
      </div>

      <div className="section-container pt-12 pb-24">
        {/* Page header */}
        <div className="mb-10">
          <p className="eyebrow text-gold mb-3">Library</p>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-3">Dealer Resources</h1>
          <p className="font-body text-stone-600 max-w-2xl">
            Onboarding forms, installation guides, and reference documents. Download or view any document below.
          </p>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <div className="relative max-w-xl">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
              aria-hidden="true"
            >
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
              <path d="M14 14L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources (e.g., fascia, credit, glass)..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-stone-300 font-body text-sm placeholder-stone-400 focus:outline-none focus:border-gold transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-ink text-xs font-body uppercase tracking-wider"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-stone-200">
          {[
            { id: "all" as const, label: `All (${categoryCounts.all})` },
            { id: "onboarding" as const, label: `Onboarding (${categoryCounts.onboarding})` },
            { id: "installation" as const, label: `Installation (${categoryCounts.installation})` },
            { id: "reference" as const, label: `Reference (${categoryCounts.reference})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-5 py-3 text-xs font-body font-bold uppercase tracking-widest border-b-2 transition-colors ${
                activeCategory === tab.id
                  ? "border-gold text-ink"
                  : "border-transparent text-stone-500 hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results count when searching */}
        {searchQuery && (
          <p className="font-body text-sm text-stone-600 mb-4">
            {filteredResources.length === 0
              ? `No resources match "${searchQuery}"`
              : `${filteredResources.length} result${filteredResources.length === 1 ? "" : "s"} for "${searchQuery}"`}
          </p>
        )}

        {/* Resource grid */}
        {filteredResources.length === 0 ? (
          <div className="bg-white border border-stone-200 p-12 text-center">
            <p className="font-body text-stone-500 mb-2">No resources found.</p>
            <p className="font-body text-sm text-stone-400">Try different keywords or clear your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((doc) => (
              <div
                key={doc.name}
                className="block p-6 bg-white border border-stone-200 hover:border-gold transition-colors"
              >
                <div className="mb-4">
                  <p className="eyebrow text-stone-400 mb-2">{CATEGORY_LABELS[doc.category]} · PDF</p>
                  <h3 className="font-heading text-lg font-bold mb-2">{doc.name}</h3>
                  <p className="font-body text-sm text-stone-600">{doc.description}</p>
                </div>
                <div className="flex gap-2">
                  <a href={doc.url} download className="btn-gold text-xs px-4 py-2 flex-1 text-center">
                    Download
                  </a>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline-dark text-xs px-4 py-2 flex-1 text-center"
                  >
                    View
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
