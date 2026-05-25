"use client";

/**
 * Public-facing layout for pre-auth pages: /login, /forgot-password,
 * /reset-password, /register/[token].
 *
 * Includes the marketing SiteHeader so a fresh visitor landing on /login
 * (e.g. from an email link) can still navigate back to the main marketing
 * site (innovativealuminum.com) for products / company info / quotes.
 *
 * Authenticated routes get a different layout that omits the marketing
 * chrome — the dashboard / app pages have their own internal navigation.
 */

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SiteHeader from "../components/SiteHeader";

// Already-logged-in users hitting an auth page should be bounced into the
// app rather than shown the sign-in form again. Without this, a dealer who
// bookmarks /login lands on a form even though they have a live session.
const AUTHENTICATED_LANDING = "/";
const ADMIN_LANDING = "/admin/dashboard";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // /reset-password explicitly opens a recovery session — don't bounce
    // those users to the dashboard, they're mid-flow.
    if (pathname?.startsWith("/reset-password")) return;

    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled || !session) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();
      router.replace(profile?.role === "admin" ? ADMIN_LANDING : AUTHENTICATED_LANDING);
    })();
    return () => { cancelled = true; };
  }, [pathname, router]);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen">{children}</main>
    </>
  );
}
