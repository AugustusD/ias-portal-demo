"use client";

/**
 * Layout for the (authenticated) route group — wraps the dashboard (/),
 * /training, /leads, /resources, /tools/*. Replaces the old
 * app/dealers/layout.tsx auth gate.
 *
 * Guest-allowed paths: the dashboard and /training intentionally render
 * for non-logged-in visitors (in "guest mode") — they show a curated
 * preview with an "Apply to become a dealer" CTA. This mirrors the
 * pre-refactor behavior where /dealers/dashboard and /dealers/training
 * were both in GUEST_ALLOWED. Without this allow-list, the dashboard
 * URL (now /) would force every visitor through /login first — wrong
 * for a marketing-meets-portal hybrid.
 *
 * Everything else (/leads, /resources, /tools/*) gates on a session.
 *
 * Admin routes (/admin/*) have their own layout; this one doesn't touch
 * them.
 */

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Paths viewable without a session. Exact match OR a path that starts
// with one of these followed by '/' (catches /training/module-3, etc.).
const GUEST_ALLOWED_PATHS = ["/", "/training"];

function isGuestAllowed(pathname: string): boolean {
  // Exact match for "/" (root only — not /foo); prefix-match for "/training"
  // so /training, /training/module-3, etc. all count.
  if (pathname === "/") return true;
  return GUEST_ALLOWED_PATHS.some((p) => p !== "/" && (pathname === p || pathname.startsWith(p + "/")));
}

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function checkAuth() {
      if (isGuestAllowed(pathname)) {
        setChecking(false);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session) {
        router.replace("/login");
        return;
      }
      setChecking(false);
    }
    checkAuth();

    // Multi-tab sync. Bounce to /login from gated pages when:
    //   - SIGNED_OUT fires (explicit logout in another tab)
    //   - TOKEN_REFRESHED fires with null session (refresh token revoked
    //     or expired — supabase-js doesn't emit SIGNED_OUT in this case,
    //     so without this branch the user sits on a stale UI while RLS
    //     denies every fetch).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const lost = event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session);
      if (lost && !isGuestAllowed(pathname)) {
        router.replace("/login");
      }
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, [pathname, router]);

  if (checking) {
    return <main className="section-container section-padding"><p className="text-stone-600">Loading...</p></main>;
  }

  return <main className="min-h-screen">{children}</main>;
}
