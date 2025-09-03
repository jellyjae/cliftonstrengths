// Import the CSV data from the provided URL
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function importCSVPrompts() {
  console.log("[v0] Starting CSV import...")

  try {
    // Fetch the CSV data
    const csvUrl =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/strengths_wellbeing_prompts_final-xUWEFwwJZtRvTt8THVLqsHkPFROTXM.csv"
    const response = await fetch(csvUrl)
    const csvText = await response.text()

    console.log("[v0] CSV fetched, length:", csvText.length)

    // Parse CSV manually (simple parsing for this specific format)
    const lines = csvText.split("\n").filter((line) => line.trim())
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

    console.log("[v0] Headers:", headers)

    // Get all themes for mapping
    const { data: themes, error: themesError } = await supabase.from("themes").select("id, name")

    if (themesError) {
      console.error("[v0] Error fetching themes:", themesError)
      return
    }

    console.log("[v0] Found themes:", themes?.length)

    const themeMap = new Map(themes?.map((t) => [t.name, t.id]) || [])

    // Map wellbeing domains to aspects
    const domainMap: Record<string, string> = {
      Career: "career",
      Social: "social",
      Financial: "financial",
      Physical: "physical",
      Community: "community",
    }

    const promptsToInsert = []
    let validCount = 0
    let invalidCount = 0

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Simple CSV parsing - split by comma but handle quoted fields
      const values = []
      let current = ""
      let inQuotes = false

      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          values.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }
      values.push(current.trim()) // Add the last value

      if (values.length < 3) continue

      const strength = values[0]?.replace(/"/g, "").trim()
      const domain = values[1]?.replace(/"/g, "").trim()
      const prompt = values[2]?.replace(/"/g, "").trim()

      // Validate and map
      const themeId = themeMap.get(strength)
      const aspect = domainMap[domain]

      if (!themeId || !aspect || !prompt) {
        console.log("[v0] Invalid row:", { strength, domain, prompt, themeId, aspect })
        invalidCount++
        continue
      }

      promptsToInsert.push({
        theme_id: themeId,
        aspect,
        prompt_text: prompt,
      })
      validCount++
    }

    console.log("[v0] Processed rows - Valid:", validCount, "Invalid:", invalidCount)
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
        console.log("[v0] Successfully imported prompts!")
      }
    }

    // Verify the import
    const { data: promptCount } = await supabase.from("prompts").select("*", { count: "exact", head: true })

    console.log("[v0] Total prompts in database:", promptCount)
  } catch (error) {
    console.error("[v0] Import error:", error)
  }
}

importCSVPrompts()
