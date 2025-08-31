import { createClient } from "@supabase/supabase-js"

// Create a direct Supabase client for the script
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const CSV_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/strengths_wellbeing_prompts_final-xUWEFwwJZtRvTt8THVLqsHkPFROTXM.csv"

// Map CSV wellbeing domains to our enum values
const DOMAIN_MAPPING: Record<string, string> = {
  Career: "career",
  Social: "social",
  Financial: "financial",
  Physical: "physical",
  Community: "community",
}

async function importCSVPrompts() {
  console.log("Fetching CSV data...")

  try {
    // Fetch CSV data
    const response = await fetch(CSV_URL)
    const csvText = await response.text()

    // Parse CSV manually (simple parsing for this format)
    const lines = csvText.split("\n")
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

    console.log("CSV Headers:", headers)

    // Get all themes for mapping
    const { data: themes } = await supabase.from("themes").select("id, name")
    const themeMap = new Map(themes?.map((t) => [t.name, t.id]) || [])

    console.log("Available themes:", Array.from(themeMap.keys()))

    const validPrompts = []
    const invalidRows = []

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Simple CSV parsing - handle quoted fields
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""))

      if (values.length < 3) {
        invalidRows.push({ row: i + 1, reason: "Insufficient columns", data: line })
        continue
      }

      const [strength, wellbeingDomain, prompt] = values

      // Map theme name to ID
      const themeId = themeMap.get(strength)
      if (!themeId) {
        invalidRows.push({ row: i + 1, reason: `Unknown strength: ${strength}`, data: line })
        continue
      }

      // Map wellbeing domain
      const aspect = DOMAIN_MAPPING[wellbeingDomain]
      if (!aspect) {
        invalidRows.push({ row: i + 1, reason: `Unknown wellbeing domain: ${wellbeingDomain}`, data: line })
        continue
      }

      if (!prompt || prompt.length < 10) {
        invalidRows.push({ row: i + 1, reason: "Prompt too short or empty", data: line })
        continue
      }

      validPrompts.push({
        theme_id: themeId,
        aspect,
        prompt_text: prompt,
        tags: [],
      })
    }

    console.log(`\nProcessed ${lines.length - 1} rows:`)
    console.log(`Valid prompts: ${validPrompts.length}`)
    console.log(`Invalid rows: ${invalidRows.length}`)

    if (invalidRows.length > 0) {
      console.log("\nInvalid rows:")
      invalidRows.forEach((row) => {
        console.log(`Row ${row.row}: ${row.reason}`)
      })
    }

    // Insert valid prompts in batches
    if (validPrompts.length > 0) {
      console.log("\nInserting prompts...")

      const batchSize = 100
      let inserted = 0
      let skipped = 0

      for (let i = 0; i < validPrompts.length; i += batchSize) {
        const batch = validPrompts.slice(i, i + batchSize)

        const { data, error } = await supabase
          .from("prompts")
          .upsert(batch, {
            onConflict: "theme_id,aspect,prompt_text",
            ignoreDuplicates: true,
          })
          .select()

        if (error) {
          console.error("Error inserting batch:", error)
        } else {
          const batchInserted = data?.length || 0
          inserted += batchInserted
          skipped += batch.length - batchInserted
          console.log(
            `Batch ${Math.floor(i / batchSize) + 1}: ${batchInserted} inserted, ${batch.length - batchInserted} skipped`,
          )
        }
      }

      console.log(`\nFinal results:`)
      console.log(`Total inserted: ${inserted}`)
      console.log(`Total skipped (duplicates): ${skipped}`)
      console.log(`Total invalid: ${invalidRows.length}`)
    }
  } catch (error) {
    console.error("Error importing CSV:", error)
  }
}

// Run the import
importCSVPrompts()
