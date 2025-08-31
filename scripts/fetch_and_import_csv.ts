import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function fetchAndImportCSV() {
  console.log("[v0] Starting CSV fetch and import process...")

  try {
    // Fetch CSV data
    const csvUrl =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/strengths_wellbeing_prompts_final-c1SNyuU84TqIOTdAEEaMReL0XJ5sd8.csv"
    console.log("[v0] Fetching CSV from:", csvUrl)

    const response = await fetch(csvUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`)
    }

    const csvText = await response.text()
    console.log("[v0] CSV fetched successfully, length:", csvText.length)

    // Parse CSV manually (simple parsing for this specific format)
    const lines = csvText.split("\n").filter((line) => line.trim())
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    console.log("[v0] CSV headers:", headers)

    const rows = lines
      .slice(1)
      .map((line) => {
        const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
        return {
          strength: values[0],
          wellbeingDomain: values[1],
          prompt: values[2],
        }
      })
      .filter((row) => row.strength && row.wellbeingDomain && row.prompt)

    console.log("[v0] Parsed", rows.length, "valid rows")
    console.log("[v0] Sample rows:", rows.slice(0, 3))

    // Get unique strengths and wellbeing domains
    const uniqueStrengths = [...new Set(rows.map((r) => r.strength))]
    const uniqueDomains = [...new Set(rows.map((r) => r.wellbeingDomain))]
    console.log("[v0] Unique strengths:", uniqueStrengths.length, uniqueStrengths)
    console.log("[v0] Unique domains:", uniqueDomains.length, uniqueDomains)

    // Map wellbeing domains to our database enum values
    const domainMapping: Record<string, string> = {
      Career: "career",
      Social: "social",
      Financial: "financial",
      Physical: "physical",
      Community: "community",
    }

    // Get all themes from database to map strength names to IDs
    console.log("[v0] Fetching themes from database...")
    const { data: themes, error: themesError } = await supabase.from("themes").select("id, name")

    if (themesError) {
      console.error("[v0] Error fetching themes:", themesError)
      return
    }

    console.log("[v0] Found", themes?.length || 0, "themes in database")

    // Create theme name to ID mapping
    const themeMapping: Record<string, string> = {}
    themes?.forEach((theme) => {
      themeMapping[theme.name] = theme.id
    })

    // Prepare prompts for insertion
    const promptsToInsert = []
    let skipped = 0

    for (const row of rows) {
      const themeId = themeMapping[row.strength]
      const aspect = domainMapping[row.wellbeingDomain]

      if (!themeId) {
        console.log("[v0] Skipping row - unknown strength:", row.strength)
        skipped++
        continue
      }

      if (!aspect) {
        console.log("[v0] Skipping row - unknown domain:", row.wellbeingDomain)
        skipped++
        continue
      }

      promptsToInsert.push({
        theme_id: themeId,
        aspect: aspect,
        prompt_text: row.prompt,
        tags: [],
      })
    }

    console.log("[v0] Prepared", promptsToInsert.length, "prompts for insertion")
    console.log("[v0] Skipped", skipped, "invalid rows")

    // Insert prompts in batches
    const batchSize = 100
    let inserted = 0
    let duplicates = 0

    for (let i = 0; i < promptsToInsert.length; i += batchSize) {
      const batch = promptsToInsert.slice(i, i + batchSize)
      console.log(
        "[v0] Inserting batch",
        Math.floor(i / batchSize) + 1,
        "of",
        Math.ceil(promptsToInsert.length / batchSize),
      )

      const { data, error } = await supabase
        .from("prompts")
        .upsert(batch, {
          onConflict: "theme_id,aspect,prompt_text",
          ignoreDuplicates: true,
        })
        .select()

      if (error) {
        console.error("[v0] Error inserting batch:", error)
        continue
      }

      const batchInserted = data?.length || 0
      inserted += batchInserted
      duplicates += batch.length - batchInserted

      console.log("[v0] Batch inserted:", batchInserted, "duplicates:", batch.length - batchInserted)
    }

    console.log("[v0] Import complete!")
    console.log("[v0] Total inserted:", inserted)
    console.log("[v0] Total duplicates:", duplicates)
    console.log("[v0] Total skipped:", skipped)

    // Verify the import
    const { data: promptCount, error: countError } = await supabase
      .from("prompts")
      .select("*", { count: "exact", head: true })

    if (!countError) {
      console.log("[v0] Total prompts in database:", promptCount)
    }

    // Show sample prompts by aspect
    for (const aspect of ["career", "social", "financial", "physical", "community"]) {
      const { data: samplePrompts, error } = await supabase
        .from("prompts")
        .select("prompt_text, themes(name)")
        .eq("aspect", aspect)
        .limit(2)

      if (!error && samplePrompts?.length) {
        console.log(`[v0] Sample ${aspect} prompts:`, samplePrompts)
      }
    }
  } catch (error) {
    console.error("[v0] Import failed:", error)
  }
}

fetchAndImportCSV()
