import { createClient } from '@supabase/supabase-js'

// During Next.js static prerendering at build time, this module is evaluated
// even though all client components defer real Supabase calls to runtime.
// If the env vars are missing (e.g., a Vercel preview deployment without
// NEXT_PUBLIC_SUPABASE_* configured), createClient(undefined, undefined) used
// to throw "supabaseUrl is required" and the entire build failed.
//
// Fall back to harmless placeholders so module construction succeeds at build
// time. At real runtime the env vars are embedded into the client bundle by
// the build, so the client connects to the correct project. If you see network
// errors against `placeholder.supabase.co` in the browser, you have a deployed
// build that was compiled without the real env vars — set them in Vercel's
// project settings for the affected environment.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
