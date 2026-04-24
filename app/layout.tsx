import type { Metadata } from "next";
import { Ubuntu, Titillium_Web } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-ubuntu",
  display: "swap",
});

const titillium = Titillium_Web({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-titillium",
  display: "swap",
});

export const metadata: Metadata = {
  title: "IAS Dealer Portal",
  description: "Demo dealer portal for Innovative Aluminum Systems",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${ubuntu.variable} ${titillium.variable}`}>
      <body>
        <header className="border-b border-stone-200 bg-cream">
          <nav className="section-container flex items-center justify-between py-6">
            <Link href="/" className="font-heading text-xl font-bold text-ink">
              IAS
            </Link>
            <ul className="hidden md:flex items-center gap-8">
              <li><Link href="/products" className="nav-link">Products</Link></li>
              <li><Link href="/dealers" className="nav-link">Dealers</Link></li>
              <li><Link href="/designer-tool" className="nav-link">Designer Tool</Link></li>
              <li><Link href="/company" className="nav-link">Company</Link></li>
              <li><Link href="/resources" className="nav-link">Resources</Link></li>
            </ul>
            <Link href="/dealers/login" className="btn-gold">Dealer Login</Link>
          </nav>
        </header>
        <main className="min-h-screen">{children}</main>
        <footer className="border-t border-stone-200 bg-ink text-cream py-12">
          <div className="section-container text-center">
            <p className="font-body text-sm">© 2026 Innovative Aluminum Systems · Demo Build</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
