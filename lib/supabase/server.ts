import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

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

  // Validate URL format
  try {
    new URL(supabaseUrl)
  } catch (error) {
    console.error("[v0] Invalid Supabase URL format:", supabaseUrl)
    throw new Error(`Invalid Supabase URL format: ${error instanceof Error ? error.message : "Unknown error"}`)
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}
