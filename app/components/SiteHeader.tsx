"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Authenticated app surfaces that have their own internal header. The global
// marketing header would just stack and eat vertical space on mobile.
const APP_PATH_PREFIXES = [
  "/admin",
  "/dealers/dashboard",
  "/dealers/leads",
  "/dealers/training",
  "/dealers/resources",
  "/dealers/tools",
  "/dealers/register",
];

export default function SiteHeader() {
  const pathname = usePathname() || "/";
  const isAppSurface = APP_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (isAppSurface) return null;

  return (
    <header className="border-b border-stone-200 bg-cream">
      <nav className="section-container flex items-center justify-between py-6">
        <Link href="/" className="font-heading text-xl font-bold text-ink">
          IAS
        </Link>
        <ul className="hidden lg:flex items-center gap-8">
          <li><a href="https://innovativealuminum.com/products" className="nav-link">Products</a></li>
          <li><a href="https://innovativealuminum.com/designer-tool" className="nav-link">Designer Tool</a></li>
          <li><a href="https://innovativealuminum.com/company" className="nav-link">Company</a></li>
          <li><a href="https://innovativealuminum.com/resources" className="nav-link">Resources</a></li>
        </ul>
        <div className="flex items-center gap-3">
          <Link
            href="/dealers/dashboard"
            className="hidden md:inline-flex items-center px-5 py-2.5 text-xs font-body font-bold uppercase tracking-widest border-2 border-ink text-ink hover:bg-ink hover:text-cream transition-colors"
          >
            Dealer Portal
          </Link>
          <a
            href="https://innovativealuminum.com/quote"
            className="btn-gold"
          >
            Get a Quote
          </a>
        </div>
      </nav>
    </header>
  );
}
