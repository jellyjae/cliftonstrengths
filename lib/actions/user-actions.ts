"use server"

import { createClient } from "@/lib/supabase/server"
import type { UserStrength } from "@/lib/types"

export async function getUserStrengths(deviceId: string): Promise<{
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

export async function createUserProfile(deviceId: string, strengths: Array<{ theme_id: string; rank: number }>) {
  try {
    console.log("[v0] Creating/updating user profile for device:", deviceId)

    const supabase = await createClient()

    // Upsert profile (create or update)
    const { data: profile, error: profileError } = await supabase
      .from("profile")
      .upsert({ device_id: deviceId, updated_at: new Date().toISOString() }, { onConflict: "device_id" })
      .select("id")
      .single()

    if (profileError) {
      console.error("[v0] Error upserting profile:", profileError)
      return { error: "Failed to create/update profile" }
    }

    console.log("[v0] Profile upserted:", profile.id)

    // Clear existing user strengths for this profile
    const { error: deleteError } = await supabase
      .from("user_strengths")
      .delete()
      .eq("profile_id", profile.id)

    if (deleteError) {
      console.error("[v0] Error clearing existing strengths:", deleteError)
      return { error: "Failed to clear existing strengths" }
    }

    // Create new user strengths
    const strengthsToInsert = strengths.map(strength => ({
      profile_id: profile.id,
      theme_id: strength.theme_id,
      rank: strength.rank
    }))

    const { error: strengthsError } = await supabase
      .from("user_strengths")
      .insert(strengthsToInsert)

    if (strengthsError) {
      console.error("[v0] Error creating user strengths:", strengthsError)
      return { error: "Failed to save strengths" }
    }

    console.log("[v0] User strengths saved successfully")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error in createUserProfile:", error)
    return { error: "Failed to create user profile" }
  }
}
