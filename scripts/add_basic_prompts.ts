// Add basic prompts to the database using anon key
import { config } from "dotenv"
import { createClient } from "@supabase/supabase-js"

// Load environment variables
config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function addBasicPrompts() {
  console.log("[v0] Starting basic prompts import...")

  try {
    // Get all themes for mapping
    const { data: themes, error: themesError } = await supabase.from("themes").select("id, name")

    if (themesError) {
      console.error("[v0] Error fetching themes:", themesError)
      return
    }

    console.log("[v0] Found themes:", themes?.length)

    const themeMap = new Map(themes?.map((t) => [t.name, t.id]) || [])

    // Basic prompts for each strength and aspect
    const basicPrompts = [
      // Achiever
      { theme: "Achiever", aspect: "career", prompt: "What specific goal can you accomplish today that will make you feel most productive?" },
      { theme: "Achiever", aspect: "social", prompt: "How can you help someone else achieve something meaningful today?" },
      { theme: "Achiever", aspect: "financial", prompt: "What financial milestone can you work towards completing this week?" },
      { theme: "Achiever", aspect: "physical", prompt: "What physical challenge can you set and complete today?" },
      { theme: "Achiever", aspect: "community", prompt: "How can you contribute to a community project or cause you care about?" },
      
      // Learner
      { theme: "Learner", aspect: "career", prompt: "What new skill or knowledge can you acquire at work today?" },
      { theme: "Learner", aspect: "social", prompt: "What can you learn from a conversation with someone new today?" },
      { theme: "Learner", aspect: "financial", prompt: "What financial concept or strategy can you research and understand better?" },
      { theme: "Learner", aspect: "physical", prompt: "What new physical activity or exercise technique can you try today?" },
      { theme: "Learner", aspect: "community", prompt: "What can you learn about your local community that you didn't know before?" },
      
      // Strategic
      { theme: "Strategic", aspect: "career", prompt: "What alternative approach could you take to solve a work challenge today?" },
      { theme: "Strategic", aspect: "social", prompt: "How can you strategically build or strengthen an important relationship?" },
      { theme: "Strategic", aspect: "financial", prompt: "What long-term financial strategy can you develop or refine today?" },
      { theme: "Strategic", aspect: "physical", prompt: "How can you strategically plan your physical wellbeing for the next month?" },
      { theme: "Strategic", aspect: "community", prompt: "What strategic approach could improve a community issue you care about?" },
      
      // Ideation
      { theme: "Ideation", aspect: "career", prompt: "What creative idea could improve your work process or environment?" },
      { theme: "Ideation", aspect: "social", prompt: "What innovative way could you connect with someone today?" },
      { theme: "Ideation", aspect: "financial", prompt: "What creative solution could help you save or invest money?" },
      { theme: "Ideation", aspect: "physical", prompt: "What imaginative approach could make your physical routine more enjoyable?" },
      { theme: "Ideation", aspect: "community", prompt: "What new idea could benefit your community or neighborhood?" },
      
      // Individualization
      { theme: "Individualization", aspect: "career", prompt: "How can you recognize and appreciate someone's unique contribution at work today?" },
      { theme: "Individualization", aspect: "social", prompt: "What makes someone in your life unique, and how can you celebrate that today?" },
      { theme: "Individualization", aspect: "financial", prompt: "How can you personalize your financial approach to better suit your unique situation?" },
      { theme: "Individualization", aspect: "physical", prompt: "What unique physical activity would be perfect for your personal preferences?" },
      { theme: "Individualization", aspect: "community", prompt: "How can you use your understanding of individual differences to help your community?" },
    ]

    const promptsToInsert = []
    let validCount = 0
    let invalidCount = 0

    // Process each prompt
    for (const promptData of basicPrompts) {
      const themeId = themeMap.get(promptData.theme)
      
      if (!themeId) {
        console.log("[v0] Invalid theme:", promptData.theme)
        invalidCount++
        continue
      }

      promptsToInsert.push({
        theme_id: themeId,
        aspect: promptData.aspect,
        prompt_text: promptData.prompt,
      })
      validCount++
    }

    console.log("[v0] Processed prompts - Valid:", validCount, "Invalid:", invalidCount)
    console.log("[v0] Sample prompts:", promptsToInsert.slice(0, 3))

    // Insert prompts in batches
    if (promptsToInsert.length > 0) {
      const { data, error } = await supabase.from("prompts").upsert(promptsToInsert, {
        onConflict: "theme_id,aspect,prompt_text",
        ignoreDuplicates: true,
      })

      if (error) {
        console.error("[v0] Error inserting prompts:", error)
      } else {
        console.log("[v0] Successfully imported basic prompts!")
      }
    }

    // Verify the import
    const { data: promptCount } = await supabase.from("prompts").select("*", { count: "exact", head: true })

    console.log("[v0] Total prompts in database:", promptCount)
  } catch (error) {
    console.error("[v0] Import error:", error)
  }
}

addBasicPrompts()
