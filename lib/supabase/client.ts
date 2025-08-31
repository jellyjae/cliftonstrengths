import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  console.log("[v0] Environment variables check:", {
    url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + "...",
    keyValue: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + "...",
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables:", {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey,
      allEnvVars: Object.keys(process.env).filter((key) => key.includes("SUPABASE")),
    })
    throw new Error("Supabase environment variables are not available. Please check your project configuration.")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
