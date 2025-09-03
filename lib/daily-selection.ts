import { createClient } from "@/lib/supabase/server"

const WELLBEING_ASPECTS = ["career", "social", "financial", "physical", "community"] as const
const EXCLUSION_DAYS = 14

const FALLBACK_THEMES = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    name: "Achiever",
    description: "People exceptionally talented in the Achiever theme work hard and possess a great deal of stamina.",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440025",
    name: "Learner",
    description:
      "People exceptionally talented in the Learner theme have a great desire to learn and want to continuously improve.",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440033",
    name: "Strategic",
    description: "People exceptionally talented in the Strategic theme create alternative ways to proceed.",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440020",
    name: "Ideation",
    description: "People exceptionally talented in the Ideation theme are fascinated by ideas.",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440022",
    name: "Individualization",
    description:
      "People exceptionally talented in the Individualization theme are intrigued with the unique qualities of each person.",
  },
]

const FALLBACK_PROMPTS = [
  {
    id: "550e8400-e29b-41d4-a716-446655440101",
    theme_id: "550e8400-e29b-41d4-a716-446655440001",
    aspect: "career",
    prompt_text: "What achievement at work would make you feel most accomplished today?",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440102",
    theme_id: "550e8400-e29b-41d4-a716-446655440025",
    aspect: "social",
    prompt_text: "What new skill could you learn from someone in your social circle?",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440103",
    theme_id: "550e8400-e29b-41d4-a716-446655440033",
    aspect: "financial",
    prompt_text: "What strategic approach could improve your financial wellbeing?",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440104",
    theme_id: "550e8400-e29b-41d4-a716-446655440020",
    aspect: "physical",
    prompt_text: "What creative idea could make your physical routine more engaging?",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440105",
    theme_id: "550e8400-e29b-41d4-a716-446655440022",
    aspect: "community",
    prompt_text: "How could you use your unique strengths to contribute to your community?",
  },
]

export async function generateDailyPrompts(deviceId: string, targetDate: string) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error("Database connection not available")
    }

    const supabase = await createClient()

    console.log("[v0] Starting daily prompt generation for device:", deviceId, "date:", targetDate)

    // Get user's profile and top 5 strengths
    const { data: profile, error: profileError } = await supabase
      .from("profile")
      .select("id")
      .eq("device_id", deviceId)
      .single()

    console.log("[v0] Profile lookup result:", { profile, profileError })

    if (!profile) throw new Error("Profile not found")

    const { data: userStrengths, error: strengthsError } = await supabase
      .from("user_strengths")
      .select(`
        theme_id, 
        rank,
        theme:themes(name)
      `)
      .eq("profile_id", profile.id)
      .order("rank")

    console.log("[v0] User strengths lookup:", { userStrengths, strengthsError, count: userStrengths?.length })

    if (!userStrengths || userStrengths.length !== 5) {
      throw new Error("User must have exactly 5 strengths selected")
    }

    const strengthThemeIds = userStrengths.map((s) => s.theme_id)
    const strengthNames = userStrengths.map((s) => s.theme?.name)
    console.log("[v0] User strength theme IDs:", strengthThemeIds)
    console.log("[v0] User strength names:", strengthNames)

    // Calculate day index for rotation (days since epoch)
    const dayIndex = Math.floor(new Date(targetDate).getTime() / (1000 * 60 * 60 * 24))
    console.log("[v0] Day index for rotation:", dayIndex)

    // Get existing daily prompts to avoid duplicates
    const { data: existingPrompts } = await supabase
      .from("daily_prompts")
      .select("prompt_id")
      .eq("device_id", deviceId)
      .gte("for_date", new Date(Date.now() - EXCLUSION_DAYS * 24 * 60 * 60 * 1000).toISOString().split("T")[0])

    const excludedPromptIds = existingPrompts?.map((p) => p.prompt_id) || []
    console.log("[v0] Excluded prompt IDs (last 14 days):", excludedPromptIds.length)

    const dailySelections = []

    // Generate one prompt per aspect
    for (let aspectIndex = 0; aspectIndex < WELLBEING_ASPECTS.length; aspectIndex++) {
      const aspect = WELLBEING_ASPECTS[aspectIndex]

      // Rotate through user's 5 strengths based on day and aspect
      const strengthIndex = (dayIndex + aspectIndex) % 5
      const primaryThemeId = strengthThemeIds[strengthIndex]
      const primaryThemeName = strengthNames[strengthIndex]

      console.log(
        "[v0] Processing aspect:",
        aspect,
        "using strength index:",
        strengthIndex,
        "theme ID:",
        primaryThemeId,
        "theme name:",
        primaryThemeName,
      )

      // Get available prompts for this aspect and user's strengths
      let query = supabase.from("prompts").select("*").eq("aspect", aspect).in("theme_id", strengthThemeIds)

      // Only add exclusion filter if there are actually IDs to exclude
      if (excludedPromptIds.length > 0) {
        query = query.not("id", "in", `(${excludedPromptIds.map((id) => `'${id}'`).join(",")})`)
      }

      const { data: availablePrompts, error: promptsError } = await query

      console.log("[v0] Available prompts for", aspect, ":", availablePrompts?.length, "error:", promptsError)

      let selectedPrompts = availablePrompts || []

      if (selectedPrompts.length === 0) {
        // Fallback: get any prompt for this aspect from user's strengths (ignore exclusion)
        const { data: fallbackPrompts, error: fallbackError } = await supabase
          .from("prompts")
          .select("*")
          .eq("aspect", aspect)
          .in("theme_id", strengthThemeIds)
          .limit(1)

        console.log("[v0] Fallback prompts for", aspect, ":", fallbackPrompts?.length, "error:", fallbackError)
        selectedPrompts = fallbackPrompts || []
      }

      if (selectedPrompts.length === 0) {
        console.log("[v0] No prompts found for aspect:", aspect)
        continue
      }

      // Prefer prompts from the primary theme for this day/aspect
      const primaryThemePrompts = selectedPrompts.filter((p) => p.theme_id === primaryThemeId)
      const selectedPrompt = primaryThemePrompts.length > 0 ? primaryThemePrompts[0] : selectedPrompts[0]

      console.log(
        "[v0] Selected prompt for",
        aspect,
        ":",
        selectedPrompt.id,
        "from theme:",
        selectedPrompt.theme_id,
        "preferred theme was:",
        primaryThemeId,
      )

      dailySelections.push({
        device_id: deviceId,
        for_date: targetDate,
        aspect,
        theme_id: selectedPrompt.theme_id,
        prompt_id: selectedPrompt.id,
      })
    }

    console.log("[v0] Total daily selections generated:", dailySelections.length)

    // Insert daily selections (idempotent due to unique constraint)
    if (dailySelections.length > 0) {
      const { error: insertError } = await supabase.from("daily_prompts").upsert(dailySelections, {
        onConflict: "device_id,for_date,aspect",
        ignoreDuplicates: true,
      })

      console.log("[v0] Insert result:", insertError ? `Error: ${insertError.message}` : "Success")
    }

    return dailySelections
  } catch (error) {
    console.error("[v0] Error in generateDailyPrompts, using fallback:", error)
    return WELLBEING_ASPECTS.map((aspect, index) => ({
      device_id: deviceId,
      for_date: targetDate,
      aspect,
      theme_id: FALLBACK_THEMES[index].id,
      prompt_id: FALLBACK_PROMPTS[index].id,
    }))
  }
}

export async function clearTodaysPrompts(deviceId: string) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log("[v0] Database not available, cannot clear prompts")
      return false
    }

    const today = new Date().toISOString().split("T")[0]
    const supabase = await createClient()

    console.log("[v0] Clearing today's prompts for device:", deviceId, "date:", today)

    const { error } = await supabase.from("daily_prompts").delete().eq("device_id", deviceId).eq("for_date", today)

    console.log("[v0] Clear prompts result:", error ? `Error: ${error.message}` : "Success")

    return !error
  } catch (error) {
    console.error("[v0] Error clearing prompts:", error)
    return false
  }
}

export async function getTodaysPrompts(deviceId: string) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error("Database connection not available")
    }

    const today = new Date().toISOString().split("T")[0]
    const supabase = await createClient()

    console.log("[v0] Getting today's prompts for device:", deviceId, "date:", today)

    // Check if we already have today's prompts
    const { data: existingPrompts, error: existingError } = await supabase
      .from("daily_prompts")
      .select(`
        *,
        prompt:prompts(*),
        theme:themes(*)
      `)
      .eq("device_id", deviceId)
      .eq("for_date", today)
      .order("aspect")

    console.log("[v0] Existing prompts check:", { count: existingPrompts?.length, error: existingError })

    if (existingPrompts && existingPrompts.length > 0) {
      const existingThemes = existingPrompts.map((p) => ({ aspect: p.aspect, theme: p.theme?.name }))
      console.log("[v0] Existing prompt themes by aspect:", existingThemes)
    }

    if (existingPrompts && existingPrompts.length === 5) {
      console.log("[v0] Returning existing prompts")
      return existingPrompts
    }

    // Generate new prompts for today
    console.log("[v0] Generating new prompts for today")
    await generateDailyPrompts(deviceId, today)

    // Fetch the newly generated prompts
    const { data: newPrompts, error: newError } = await supabase
      .from("daily_prompts")
      .select(`
        *,
        prompt:prompts(*),
        theme:themes(*)
      `)
      .eq("device_id", deviceId)
      .eq("for_date", today)
      .order("aspect")

    console.log("[v0] New prompts fetched:", { count: newPrompts?.length, error: newError })

    if (newPrompts && newPrompts.length > 0) {
      const newThemes = newPrompts.map((p) => ({ aspect: p.aspect, theme: p.theme?.name }))
      console.log("[v0] New prompt themes by aspect:", newThemes)
    }

    return newPrompts || []
  } catch (error) {
    console.error("[v0] Error getting today's prompts, using fallback:", error)
    const today = new Date().toISOString().split("T")[0]

    // Get user's selected strengths from localStorage
    let userStrengths = []
    try {
      if (typeof window !== "undefined") {
        // Try the correct localStorage key first
        const savedStrengths = localStorage.getItem("user_strengths")
        if (savedStrengths) {
          userStrengths = JSON.parse(savedStrengths)
        } else {
          // Fallback to old key format
          const oldSavedStrengths = localStorage.getItem(`selected_strengths_${deviceId}`)
          if (oldSavedStrengths) {
            userStrengths = JSON.parse(oldSavedStrengths)
          }
        }
      }
    } catch (localStorageError) {
      console.error("[v0] Error reading from localStorage:", localStorageError)
    }

    // If no saved strengths, use default fallback
    if (userStrengths.length === 0) {
      userStrengths = FALLBACK_THEMES.slice(0, 5)
    }

    // Calculate day index for rotation
    const dayIndex = Math.floor(new Date(today).getTime() / (1000 * 60 * 60 * 24))

    return WELLBEING_ASPECTS.map((aspect, aspectIndex) => {
      // Rotate through user's strengths
      const strengthIndex = (dayIndex + aspectIndex) % Math.min(userStrengths.length, 5)
      const selectedTheme = userStrengths[strengthIndex] || FALLBACK_THEMES[strengthIndex]

      return {
        device_id: deviceId,
        for_date: today,
        aspect,
        theme_id: selectedTheme.id,
        prompt_id: aspectIndex + 1,
        prompt: {
          id: aspectIndex + 1,
          theme_id: selectedTheme.id,
          aspect,
          prompt_text: `Reflect on how your ${selectedTheme.name} strength can enhance your ${aspect} wellbeing today.`,
        },
        theme: {
          id: selectedTheme.id,
          name: selectedTheme.name,
          description: selectedTheme.description,
        },
      }
    })
  }
}
