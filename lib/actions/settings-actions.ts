"use server"

import { createClient } from "@/lib/supabase/server"
import { generateDailyPrompts } from "@/lib/daily-selection"

export async function updateUserStrengths(deviceId: string, themeIds: string[]) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error("Database connection not available")
    }

    const supabase = await createClient()

    // Get or create profile
    const { data: profile, error: profileError } = await supabase
      .from("profile")
      .upsert({ device_id: deviceId, updated_at: new Date().toISOString() }, { onConflict: "device_id" })
      .select()
      .single()

    if (profileError) throw profileError

    // Clear existing strengths
    await supabase.from("user_strengths").delete().eq("profile_id", profile.id)

    // Insert new strengths with ranks
    const strengthsToInsert = themeIds.map((themeId, index) => ({
      profile_id: profile.id,
      theme_id: themeId,
      rank: index + 1,
    }))

    const { error: strengthsError } = await supabase.from("user_strengths").insert(strengthsToInsert)
    if (strengthsError) throw strengthsError

    // Re-generate today's prompts with new strengths
    await generateDailyPrompts(deviceId)

    return { success: true }
  } catch (error) {
    console.error("[v0] Error updating strengths:", error)
    throw new Error(`Failed to update strengths: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function resetUserData(deviceId: string) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error("Database connection not available")
    }

    const supabase = await createClient()

    // First get the profile ID
    const { data: profile, error: profileError } = await supabase
      .from("profile")
      .select("id")
      .eq("device_id", deviceId)
      .single()

    if (profileError || !profile) {
      console.log("[v0] No profile found for device:", deviceId)
      return { success: true } // Nothing to delete
    }

    // Delete all user data for this device
    await Promise.all([
      supabase.from("completions").delete().eq("device_id", deviceId),
      supabase.from("daily_prompts").delete().eq("device_id", deviceId),
      supabase.from("user_strengths").delete().eq("profile_id", profile.id),
    ])

    return { success: true }
  } catch (error) {
    console.error("[v0] Error resetting data:", error)
    throw new Error(`Failed to reset data: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function getCurrentUserStrengths(deviceId: string) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return []
    }

    const supabase = await createClient()

    // First get the profile ID
    const { data: profile, error: profileError } = await supabase
      .from("profile")
      .select("id")
      .eq("device_id", deviceId)
      .single()

    if (profileError || !profile) {
      console.log("[v0] No profile found for device:", deviceId)
      return []
    }

    // Then get user strengths using the profile ID
    const { data: strengths, error } = await supabase
      .from("user_strengths")
      .select(`
        rank,
        themes!inner(
          id,
          name,
          description
        )
      `)
      .eq("profile_id", profile.id)
      .order("rank")

    if (error) throw error

    return strengths?.map((s) => s.themes) || []
  } catch (error) {
    console.error("[v0] Error fetching current strengths:", error)
    return []
  }
}
