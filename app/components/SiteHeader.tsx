"use client";

/**
 * Marketing-style header shown on the public auth pages (/login,
 * /forgot-password, /reset-password, /register/[token]).
 *
 * Used to be rendered globally with a path-prefix block-list to hide
 * itself on app surfaces. After the /* → / restructure, layout
 * scoping handles that — the (auth) route group includes this component,
 * the (authenticated) and /admin layouts don't. Much cleaner.
 *
 * Logo link goes to / which is now the dashboard (auth-gated). Anyone
 * not signed in clicking the logo will be bounced through the auth check
 * back to /login.
 */

import Link from "next/link";

export default function SiteHeader() {
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
            href="/"
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
