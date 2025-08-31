// Debug script to check current database state
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugDatabaseState() {
  console.log("🔍 Checking database state...\n")

  try {
    // Check themes table
    const { data: themes, error: themesError } = await supabase.from("themes").select("*").limit(5)

    console.log("📋 Themes table:")
    console.log(`  Count: ${themes?.length || 0}`)
    if (themesError) console.log(`  Error: ${themesError.message}`)
    if (themes?.length) {
      console.log(`  Sample: ${themes.map((t) => t.name).join(", ")}`)
    }
    console.log()

    // Check prompts table
    const { data: prompts, error: promptsError } = await supabase.from("prompts").select("*").limit(5)

    console.log("💭 Prompts table:")
    console.log(`  Count: ${prompts?.length || 0}`)
    if (promptsError) console.log(`  Error: ${promptsError.message}`)
    if (prompts?.length) {
      console.log(`  Sample aspects: ${prompts.map((p) => p.aspect).join(", ")}`)
    }
    console.log()

    // Check user_strengths table
    const { data: userStrengths, error: userStrengthsError } = await supabase
      .from("user_strengths")
      .select("*, themes(name)")
      .limit(10)

    console.log("💪 User strengths:")
    console.log(`  Count: ${userStrengths?.length || 0}`)
    if (userStrengthsError) console.log(`  Error: ${userStrengthsError.message}`)
    if (userStrengths?.length) {
      console.log(`  Strengths: ${userStrengths.map((s) => s.themes?.name).join(", ")}`)
    }
    console.log()

    // Check daily_prompts table
    const { data: dailyPrompts, error: dailyPromptsError } = await supabase.from("daily_prompts").select("*").limit(5)

    console.log("📅 Daily prompts:")
    console.log(`  Count: ${dailyPrompts?.length || 0}`)
    if (dailyPromptsError) console.log(`  Error: ${dailyPromptsError.message}`)
    if (dailyPrompts?.length) {
      console.log(`  Latest date: ${dailyPrompts[0]?.for_date}`)
    }
    console.log()
  } catch (error) {
    console.error("❌ Debug failed:", error)
  }
}

debugDatabaseState()
