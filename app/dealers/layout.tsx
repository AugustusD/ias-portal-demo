'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function DealersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // The login page must not be auth-gated (would create an infinite redirect loop)
    if (pathname === '/dealers/login') {
      setChecking(false)
      return
    }

    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/dealers/login')
        return
      }
      setChecking(false)
    }

    checkAuth()

    // Watch for sign-out events anywhere in the app and redirect
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/dealers/login')
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
          backgroundColor: '#F9F6F0',
          color: '#0A0908',
          fontFamily: 'Titillium Web, sans-serif',
          fontSize: '14px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        Loading…
      </div>
    )
  }

  return <>{children}</>
}
