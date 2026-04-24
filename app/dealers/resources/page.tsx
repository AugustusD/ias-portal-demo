"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Dealer = { name: string; email: string };

type Document = {
  name: string;
  description: string;
  url: string;
  category: "Onboarding" | "Installation" | "Reference";
};

const DOCUMENTS: Document[] = [
  {
    name: "New Customer Form",
    description: "Tell us about your business so we can set up your account properly.",
    url: "/documents/new-customer-form.pdf",
    category: "Onboarding",
  },
  {
    name: "Credit Application",
    description: "Apply for net-30 terms with IAS.",
    url: "/documents/credit-application.pdf",
    category: "Onboarding",
  },
  {
    name: "Infinity Fascia Installation Guide",
    description: "Step-by-step installation reference for fascia mount Infinity systems.",
    url: "/documents/InfinityInstallationGuideFascia.pdf",
    category: "Installation",
  },
  {
    name: "Infinity Surface Installation Guide",
    description: "Step-by-step installation reference for surface mount Infinity systems.",
    url: "/documents/InfinityInstallationGuideSurface.pdf",
    category: "Installation",
  },
  {
    name: "Wall Track Installation Guide",
    description: "Complete reference for wall track applications.",
    url: "/documents/InstallationGuideWallTrackComplete.pdf",
    category: "Installation",
  },
  {
    name: "Flex Rail Installation Guide",
    description: "Flex rail installation reference for sloped applications.",
    url: "/documents/Installation_Guide-Flex_Rail.pdf",
    category: "Installation",
  },
  {
    name: "Glass Installation Reference",
    description: "Glass measurement, ordering, and installation specifics.",
    url: "/documents/installation_glass.pdf",
    category: "Reference",
  },
  {
    name: "Picket Installation Reference",
    description: "Picket railing installation specifics.",
    url: "/documents/installation_picket.pdf",
    category: "Reference",
  },
  {
    name: "Stairs Installation Reference",
    description: "Stair railing installation guide for sloped applications.",
    url: "/documents/installation_stairs.pdf",
    category: "Reference",
  },
];

const CATEGORIES: Document["category"][] = ["Onboarding", "Installation", "Reference"];

export default function ResourcesPage() {
  const router = useRouter();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<Document["category"] | "All">("All");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("ias_dealer") : null;
    if (!stored) { router.push("/dealers/login"); return; }
    try {
      setDealer(JSON.parse(stored));
    } catch { router.push("/dealers/login"); return; }
    setLoading(false);
  }, [router]);

  if (loading || !dealer) {
    return <div className="section-container section-padding"><p className="text-stone-600">Loading...</p></div>;
  }

  const filtered = activeFilter === "All" ? DOCUMENTS : DOCUMENTS.filter((d) => d.category === activeFilter);

  return (
    <div className="bg-cream min-h-screen">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-cream border-b border-stone-200">
        <div className="section-container py-5">
          <div className="flex items-center gap-4">
            <Link href="/dealers/dashboard" className="text-sm font-body text-stone-600 hover:text-ink transition-colors">← Dashboard</Link>
            <span className="text-stone-300">/</span>
            <p className="eyebrow text-stone-600">Resources</p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="section-container pt-16 pb-12">
        <p className="eyebrow text-gold mb-4">Document Library</p>
        <h1 className="text-5xl md:text-6xl font-heading font-bold mb-4">Resources.</h1>
        <p className="font-body text-lg text-stone-600 max-w-2xl">
          Onboarding forms, installation guides, and product references. Download or view in your browser.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="section-container mb-8">
        <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-4">
          <button
            onClick={() => setActiveFilter("All")}
            className={`text-xs font-body uppercase tracking-wider px-4 py-2 transition-colors ${
              activeFilter === "All" ? "bg-ink text-cream" : "text-stone-600 hover:text-ink"
            }`}
          >
            All ({DOCUMENTS.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = DOCUMENTS.filter((d) => d.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`text-xs font-body uppercase tracking-wider px-4 py-2 transition-colors ${
                  activeFilter === cat ? "bg-ink text-cream" : "text-stone-600 hover:text-ink"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Document grid */}
      <div className="section-container pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => (
            <div key={doc.name} className="bg-white border border-stone-200 hover:border-stone-400 transition-colors p-6 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <p className="eyebrow text-stone-400">{doc.category}</p>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M14 3H6C5.45 3 5 3.45 5 4V20C5 20.55 5.45 21 6 21H18C18.55 21 19 20.55 19 20V8L14 3Z" stroke="#A89D8E" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M14 3V8H19" stroke="#A89D8E" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="font-heading text-lg font-bold mb-2">{doc.name}</h3>
              <p className="font-body text-sm text-stone-600 mb-6 flex-grow">{doc.description}</p>
              <div className="flex gap-2">
                <a href={doc.url} download className="btn-gold text-xs px-4 py-2 flex-1 text-center">
                  Download
                </a>
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn-outline-dark text-xs px-4 py-2 flex-1 text-center">
                  View
                </a>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="font-body text-stone-500">No documents in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
