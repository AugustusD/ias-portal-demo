'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }

      // Check role from profiles table. maybeSingle() instead of single() so a
      // missing profile row (e.g. user created via auth admin UI but no
      // matching profile yet) doesn't throw — it returns null and we route
      // them to the dealer side as a safe default.
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle()

      if (!profile || profile.role !== 'admin') {
        // Logged in but not an admin — kick them to the dealer side
        router.replace('/')
        return
      }

      setChecking(false)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [pathname, router])

  if (checking) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0A0908',
          color: '#B69A5A',
          fontFamily: 'Titillium Web, sans-serif',
          fontSize: '14px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        Authenticating…
      </div>
    )
  }

  return <>{children}</>
}
