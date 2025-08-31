"use server"

import { createClient } from "@/lib/supabase/server"

export async function togglePromptCompletion(deviceId: string, promptId: string, aspect: string, forDate: string) {
  try {
    const today = new Date().toISOString().split("T")[0]
    if (forDate !== today) {
      throw new Error("Completions can only be made for today's date")
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("[v0] Supabase environment variables missing in server action")
      throw new Error("Database connection not available")
    }

    const supabase = await createClient()

    // Check if completion already exists
    const { data: existing, error: checkError } = await supabase
      .from("completions")
      .select("id")
      .eq("device_id", deviceId)
      .eq("prompt_id", promptId)
      .eq("for_date", forDate)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError
    }

    if (existing) {
      // Remove completion
      const { error: deleteError } = await supabase.from("completions").delete().eq("id", existing.id)

      if (deleteError) throw deleteError

      return { completed: false }
    } else {
      // Add completion
      const { error: insertError } = await supabase.from("completions").insert({
        device_id: deviceId,
        prompt_id: promptId,
        aspect,
        for_date: forDate,
      })

      if (insertError) throw insertError

      return { completed: true }
    }
  } catch (error) {
    console.error("[v0] Error toggling completion:", error)
    throw new Error(`Failed to update completion status: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function getTodaysCompletions(deviceId: string, forDate: string) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("[v0] Supabase environment variables missing in getTodaysCompletions")
      return []
    }

    const supabase = await createClient()

    const { data: completions, error } = await supabase
      .from("completions")
      .select("prompt_id, aspect")
      .eq("device_id", deviceId)
      .eq("for_date", forDate)

    if (error) throw error

    return completions || []
  } catch (error) {
    console.error("[v0] Error fetching completions:", error)
    return []
  }
}

export async function getStreakData(deviceId: string) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error("Database connection not available")
    }

    const supabase = await createClient()

    // Get last 90 days of completion data
    // Now using direct query since day_status view considers 1+ completions as complete
    const { data: completions, error } = await supabase
      .from("completions")
      .select("for_date")
      .eq("device_id", deviceId)
      .gte("for_date", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
      .order("for_date", { ascending: false })

    if (error) throw error

    // Get unique dates where at least 1 completion exists
    const completeDays = [...new Set((completions || []).map((c) => c.for_date))].sort()

    // Calculate current streak (consecutive days from today backwards)
    let currentStreak = 0
    const today = new Date().toISOString().split("T")[0]
    const checkDate = new Date(today)

    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0]
      if (completeDays.includes(dateStr)) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    // Calculate longest streak
    let longestStreak = 0
    let tempStreak = 0
    let lastDate: Date | null = null

    for (const dateStr of completeDays) {
      const currentDate = new Date(dateStr)

      if (lastDate && currentDate.getTime() - lastDate.getTime() === 24 * 60 * 60 * 1000) {
        tempStreak++
      } else {
        tempStreak = 1
      }

      longestStreak = Math.max(longestStreak, tempStreak)
      lastDate = currentDate
    }

    return {
      currentStreak,
      longestStreak,
      totalCompleteDays: completeDays.length,
    }
  } catch (error) {
    console.error("[v0] Error calculating streaks:", error)
    throw error
  }
}
