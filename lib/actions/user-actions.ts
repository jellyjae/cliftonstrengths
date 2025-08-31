"use server"

import { createClient } from "@/lib/supabase/server"
import { getDeviceId } from "@/lib/device-id"
import type { UserStrength } from "@/lib/types"

export async function getUserStrengths(): Promise<{
  data: UserStrength[] | null
  error: string | null
  hasProfile: boolean
}> {
  try {
    console.log("[v0] Getting user strengths via server action...")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.log("[v0] Supabase environment variables not available, falling back to localStorage")
      return { data: null, error: "Database not available", hasProfile: false }
    }

    const deviceId = getDeviceId()
    if (!deviceId) {
      return { data: null, error: "No device ID found", hasProfile: false }
    }

    const supabase = await createClient()

    if (!supabase || typeof supabase.from !== "function") {
      console.log("[v0] Failed to create Supabase client, falling back to localStorage")
      return { data: null, error: "Database not available", hasProfile: false }
    }

    // First, check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from("profile")
      .select("id")
      .eq("device_id", deviceId)
      .single()

    if (profileError || !profile) {
      console.log("[v0] No profile found for device ID:", deviceId)
      return { data: null, error: null, hasProfile: false }
    }

    // Get user strengths with theme details
    const { data: strengths, error: strengthsError } = await supabase
      .from("user_strengths")
      .select(`
        id,
        profile_id,
        theme_id,
        rank,
        created_at,
        theme:themes (
          id,
          name,
          description
        )
      `)
      .eq("profile_id", profile.id)
      .order("rank")

    if (strengthsError) {
      console.error("[v0] Error fetching user strengths:", strengthsError)
      return { data: null, error: "Failed to fetch user strengths", hasProfile: true }
    }

    console.log("[v0] Successfully fetched user strengths from database:", strengths?.length || 0, "strengths")
    return { data: strengths as UserStrength[], error: null, hasProfile: true }
  } catch (error) {
    console.error("[v0] Error in getUserStrengths server action:", error)
    return { data: null, error: "Database not available", hasProfile: false }
  }
}
