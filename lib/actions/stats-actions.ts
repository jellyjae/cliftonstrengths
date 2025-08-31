"use server"

import { createClient } from "@/lib/supabase/server"

export async function getCompletionsByAspect(deviceId: string, days = 30) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("[v0] Supabase environment variables missing in getCompletionsByAspect")
      return []
    }

    const supabase = await createClient()
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    const { data: completions, error } = await supabase
      .from("completions")
      .select("aspect")
      .eq("device_id", deviceId)
      .gte("for_date", sinceDate)

    if (error) throw error

    // Count completions by aspect
    const aspectCounts = {
      career: 0,
      social: 0,
      financial: 0,
      physical: 0,
      community: 0,
    }

    completions?.forEach((completion) => {
      if (completion.aspect in aspectCounts) {
        aspectCounts[completion.aspect as keyof typeof aspectCounts]++
      }
    })

    // Get total possible completions (days * 5 aspects)
    const totalPossible = days * 5
    const totalCompleted = Object.values(aspectCounts).reduce((sum, count) => sum + count, 0)

    return {
      aspectCounts,
      totalCompleted,
      totalPossible,
      completionRate: totalPossible > 0 ? (totalCompleted / totalPossible) * 100 : 0,
    }
  } catch (error) {
    console.error("[v0] Error fetching completions by aspect:", error)
    return {
      aspectCounts: { career: 0, social: 0, financial: 0, physical: 0, community: 0 },
      totalCompleted: 0,
      totalPossible: 0,
      completionRate: 0,
    }
  }
}

export async function getCompletionsByStrength(deviceId: string, days = 30) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("[v0] Supabase environment variables missing in getCompletionsByStrength")
      return []
    }

    const supabase = await createClient()
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    // Join completions -> prompts -> themes to get strength names
    const { data: completions, error } = await supabase
      .from("completions")
      .select(`
        id,
        prompts!inner(
          theme_id,
          themes!inner(
            name
          )
        )
      `)
      .eq("device_id", deviceId)
      .gte("for_date", sinceDate)

    if (error) throw error

    // Count completions by strength
    const strengthCounts: Record<string, number> = {}

    completions?.forEach((completion: any) => {
      const strengthName = completion.prompts?.themes?.name
      if (strengthName) {
        strengthCounts[strengthName] = (strengthCounts[strengthName] || 0) + 1
      }
    })

    // Convert to array and sort by count
    const strengthData = Object.entries(strengthCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Top 5 only

    return strengthData
  } catch (error) {
    console.error("[v0] Error fetching completions by strength:", error)
    return []
  }
}
