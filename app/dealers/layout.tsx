"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const GUEST_ALLOWED = [
  "/dealers/login",
  "/dealers/dashboard",
  "/dealers/training",
  "/dealers/register",
];

function isGuestAllowed(pathname: string): boolean {
  return GUEST_ALLOWED.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default function DealersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      if (isGuestAllowed(pathname)) {
        setChecking(false);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/dealers/login");
        return;
      }
      setChecking(false);
    }
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && !isGuestAllowed(pathname)) {
        router.replace("/dealers/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  if (checking) {
    return <div className="section-container section-padding"><p className="text-stone-600">Loading...</p></div>;
  }

  return <>{children}</>;
}
