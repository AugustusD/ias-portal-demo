import type { Metadata } from "next";
import { Ubuntu, Titillium_Web } from "next/font/google";
import Header from "./components/Header";
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
        <Header />
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
