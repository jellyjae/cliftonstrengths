// Import the CSV data from the provided URL
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const CSV_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/strengths_wellbeing_prompts_final-xUWEFwwJZtRvTt8THVLqsHkPFROTXM.csv"

// Map CSV wellbeing domains to database aspects
const DOMAIN_MAPPING: Record<string, string> = {
  Career: "career",
  Social: "social",
  Financial: "financial",
  Physical: "physical",
  Community: "community",
}

async function importCSVData() {
  console.log("📥 Importing CSV data...\n")

  try {
    // Fetch CSV data
    console.log("🌐 Fetching CSV from URL...")
    const response = await fetch(CSV_URL)
    const csvText = await response.text()

    // Parse CSV manually (simple parsing for this format)
    const lines = csvText.split("\n")
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    console.log("📋 Headers:", headers)

    // Get all themes for mapping
    const { data: themes, error: themesError } = await supabase.from("themes").select("id, name")

    if (themesError) {
      console.error("❌ Error fetching themes:", themesError)
      return
    }

    const themeMap = new Map(themes?.map((t) => [t.name, t.id]) || [])
    console.log(`🎯 Found ${themeMap.size} themes in database`)

    let inserted = 0
    let skipped = 0
    let invalid = 0

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Simple CSV parsing - handle quoted fields
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""))

      if (values.length < 3) {
        invalid++
        continue
      }

      const strength = values[0]
      const domain = values[1]
      const prompt = values[2]

      // Validate and map
      const themeId = themeMap.get(strength)
      const aspect = DOMAIN_MAPPING[domain]

      if (!themeId) {
        console.log(`⚠️  Unknown strength: ${strength}`)
        invalid++
        continue
      }

      if (!aspect) {
        console.log(`⚠️  Unknown domain: ${domain}`)
        invalid++
        continue
      }

      // Insert prompt
      const { error: insertError } = await supabase.from("prompts").insert({
        theme_id: themeId,
        aspect: aspect,
        prompt_text: prompt,
        tags: [],
      })

      if (insertError) {
        if (insertError.code === "23505") {
          // Unique constraint violation
          skipped++
        } else {
          console.log(`❌ Insert error for ${strength}/${domain}: ${insertError.message}`)
          invalid++
        }
      } else {
        inserted++
      }
    }

    console.log("\n✅ Import complete!")
    console.log(`📊 Results:`)
    console.log(`  - Inserted: ${inserted}`)
    console.log(`  - Skipped (duplicates): ${skipped}`)
    console.log(`  - Invalid: ${invalid}`)
  } catch (error) {
    console.error("❌ Import failed:", error)
  }
}

importCSVData()
