"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Dealer = { name: string; email: string };

type ResourceDoc = {
  name: string;
  description: string;
  category: "onboarding" | "installation" | "brochures" | "branding" | "warranty";
  url: string;
  fileType: "PDF" | "PNG";
  tags: string[];
};

const RESOURCES: ResourceDoc[] = [
  // ONBOARDING
  {
    name: "New Customer Form",
    description: "Initial dealer application form. Complete and return to get started with IAS.",
    category: "onboarding",
    url: "/documents/new-customer-form.pdf",
    fileType: "PDF",
    tags: ["customer form", "dealer", "application", "signup", "new"],
  },
  {
    name: "Credit Application",
    description: "Apply for net-30 terms with IAS. Required for credit-based purchasing.",
    category: "onboarding",
    url: "/documents/credit-application.pdf",
    fileType: "PDF",
    tags: ["credit", "net-30", "terms", "application", "finance"],
  },

  // INSTALLATION (merged from former "Installation" + "Reference" categories)
  {
    name: "Infinity Fascia Installation Guide",
    description: "Step-by-step installation guide for fascia mount Infinity Topless railing systems.",
    category: "installation",
    url: "/documents/InfinityInstallationGuideFascia.pdf",
    fileType: "PDF",
    tags: ["infinity", "fascia", "topless", "glass", "install"],
  },
  {
    name: "Infinity Surface Installation Guide",
    description: "Step-by-step installation guide for surface mount Infinity Topless railing systems.",
    category: "installation",
    url: "/documents/InfinityInstallationGuideSurface.pdf",
    fileType: "PDF",
    tags: ["infinity", "surface", "topless", "glass", "install"],
  },
  {
    name: "Wall Track Installation Guide",
    description: "Complete wall track installation reference for all applicable systems.",
    category: "installation",
    url: "/documents/InstallationGuideWallTrackComplete.pdf",
    fileType: "PDF",
    tags: ["wall track", "mount", "install"],
  },
  {
    name: "Flex Rail Installation Guide",
    description: "Installation reference for flex rail applications.",
    category: "installation",
    url: "/documents/Installation_Guide-Flex_Rail.pdf",
    fileType: "PDF",
    tags: ["flex rail", "install", "rail"],
  },
  {
    name: "Glass Installation Guide",
    description: "Glass measurement, ordering, and installation reference for Glass Component systems.",
    category: "installation",
    url: "/documents/installation_glass.pdf",
    fileType: "PDF",
    tags: ["glass", "measurement", "install", "component"],
  },
  {
    name: "Picket Installation Guide",
    description: "Picket railing installation specifics for welded and modular picket systems.",
    category: "installation",
    url: "/documents/installation_picket.pdf",
    fileType: "PDF",
    tags: ["picket", "welded", "install", "rail"],
  },
  {
    name: "Stairs Installation Guide",
    description: "Stair railing installation guide for sloped applications.",
    category: "installation",
    url: "/documents/installation_stairs.pdf",
    fileType: "PDF",
    tags: ["stairs", "sloped", "install", "rail"],
  },

  // BROCHURES
  {
    name: "Infinity Topless Sell Sheet",
    description: "Product sell sheet for Infinity Topless Glass railing systems. Share with customers.",
    category: "brochures",
    url: "/documents/sellsheet_infinity.pdf",
    fileType: "PDF",
    tags: ["infinity", "topless", "glass", "sell sheet", "marketing", "sales"],
  },
  {
    name: "Glass Component Sell Sheet",
    description: "Product sell sheet for Glass Component railing systems. Share with customers.",
    category: "brochures",
    url: "/documents/sellsheet_glass.pdf",
    fileType: "PDF",
    tags: ["glass", "component", "sell sheet", "marketing", "sales"],
  },
  {
    name: "Picket Sell Sheet",
    description: "Product sell sheet for Picket railing systems. Share with customers.",
    category: "brochures",
    url: "/documents/sellsheet_picket.pdf",
    fileType: "PDF",
    tags: ["picket", "sell sheet", "marketing", "sales"],
  },
  {
    name: "Custom Railings Sell Sheet",
    description: "Product sell sheet for custom aluminum railing options. Share with customers.",
    category: "brochures",
    url: "/documents/sellsheet_custom.pdf",
    fileType: "PDF",
    tags: ["custom", "sell sheet", "marketing", "sales"],
  },
  {
    name: "Powder Coating Sell Sheet",
    description: "Technical sell sheet covering our 5-stage AAMA 2604 powder coating process and color options.",
    category: "brochures",
    url: "/documents/sellsheet_powdercoating.pdf",
    fileType: "PDF",
    tags: ["powder coating", "finish", "colors", "aama", "sell sheet"],
  },
  {
    name: "Complete Brochure Collection",
    description: "All-in-one brochure set covering every IAS railing system — email-sized for easy sharing.",
    category: "brochures",
    url: "/documents/Innovative_Brochures_All - email sized.pdf",
    fileType: "PDF",
    tags: ["brochure", "all", "complete", "email", "marketing", "sales"],
  },

  // BRANDING
  {
    name: "Infinity Logo (Black)",
    description: "Official Infinity logo without slogan, black version. For marketing materials and co-branding.",
    category: "branding",
    url: "/documents/Infinity No Slogan - Blk.png",
    fileType: "PNG",
    tags: ["infinity", "logo", "branding", "black", "identity"],
  },
  {
    name: "IAS Logo (Gold)",
    description: "Official Innovative Aluminum Systems logo in gold. Primary brand mark for co-branded materials.",
    category: "branding",
    url: "/documents/IAS newgold.png",
    fileType: "PNG",
    tags: ["ias", "innovative", "logo", "gold", "branding", "identity"],
  },

  // WARRANTY
  {
    name: "Residential Warranty",
    description: "Full residential warranty terms. 20-year structural, 10-year finish (5yr within 5mi of ocean).",
    category: "warranty",
    url: "/documents/INNOVATIVE-ALUMINUM-RESIDENTIAL-WARRANTY.pdf",
    fileType: "PDF",
    tags: ["warranty", "residential", "terms", "coverage", "claims"],
  },
  {
    name: "Commercial Warranty",
    description: "Full commercial warranty terms. 20-year structural, 5-year finish (1yr within 5mi of ocean).",
    category: "warranty",
    url: "/documents/INNOVATIVE-ALUMINUM-COMMERCIAL-WARRANTY.pdf",
    fileType: "PDF",
    tags: ["warranty", "commercial", "terms", "coverage", "claims", "multi-family"],
  },
];

const CATEGORY_LABELS: Record<ResourceDoc["category"], string> = {
  onboarding: "Onboarding",
  installation: "Installation",
  brochures: "Brochures",
  branding: "Branding",
  warranty: "Warranty",
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

  const filteredResources = useMemo(() => {
    let result = RESOURCES;

    if (activeCategory !== "all") {
      result = result.filter((r) => r.category === activeCategory);
    }

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

  const categoryCounts = useMemo(() => ({
    all: RESOURCES.length,
    onboarding: RESOURCES.filter((r) => r.category === "onboarding").length,
    installation: RESOURCES.filter((r) => r.category === "installation").length,
    brochures: RESOURCES.filter((r) => r.category === "brochures").length,
    branding: RESOURCES.filter((r) => r.category === "branding").length,
    warranty: RESOURCES.filter((r) => r.category === "warranty").length,
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
        <div className="mb-10">
          <p className="eyebrow text-gold mb-3">Library</p>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-3">Dealer Resources</h1>
          <p className="font-body text-stone-600 max-w-2xl">
            Onboarding forms, installation guides, sell sheets, brochures, brand assets, and warranty documents. Download or view any document below.
          </p>
        </div>

        <div className="mb-6">
          <div className="relative max-w-xl">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" aria-hidden="true">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
              <path d="M14 14L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources (e.g., fascia, infinity, warranty, logo)..."
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

        <div className="flex flex-wrap gap-2 mb-8 border-b border-stone-200">
          {[
            { id: "all" as const, label: `All (${categoryCounts.all})` },
            { id: "onboarding" as const, label: `Onboarding (${categoryCounts.onboarding})` },
            { id: "installation" as const, label: `Installation (${categoryCounts.installation})` },
            { id: "brochures" as const, label: `Brochures (${categoryCounts.brochures})` },
            { id: "branding" as const, label: `Branding (${categoryCounts.branding})` },
            { id: "warranty" as const, label: `Warranty (${categoryCounts.warranty})` },
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

        {searchQuery && (
          <p className="font-body text-sm text-stone-600 mb-4">
            {filteredResources.length === 0
              ? `No resources match "${searchQuery}"`
              : `${filteredResources.length} result${filteredResources.length === 1 ? "" : "s"} for "${searchQuery}"`}
          </p>
        )}

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
                  <p className="eyebrow text-stone-400 mb-2">{CATEGORY_LABELS[doc.category]} · {doc.fileType}</p>
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
