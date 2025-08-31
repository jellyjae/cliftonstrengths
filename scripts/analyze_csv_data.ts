// Script to fetch and analyze the CSV data structure
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function analyzeCsvData() {
  try {
    console.log("[v0] Fetching CSV data...")

    // Fetch the CSV data
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/strengths_wellbeing_prompts_final-c1SNyuU84TqIOTdAEEaMReL0XJ5sd8.csv",
    )
    const csvText = await response.text()

    console.log("[v0] CSV fetched, length:", csvText.length)

    // Parse CSV manually (simple parsing for analysis)
    const lines = csvText.split("\n").filter((line) => line.trim())
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

    console.log("[v0] Headers:", headers)
    console.log("[v0] Total rows:", lines.length - 1)

    // Analyze first few rows
    const sampleRows = lines.slice(1, 6).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
      return {
        strength: values[0],
        wellbeingDomain: values[1],
        prompt: values[2],
      }
    })

    console.log("[v0] Sample rows:", JSON.stringify(sampleRows, null, 2))

    // Get unique strengths and domains
    const allRows = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
      return {
        strength: values[0],
        wellbeingDomain: values[1],
        prompt: values[2],
      }
    })

    const uniqueStrengths = [...new Set(allRows.map((r) => r.strength))].sort()
    const uniqueDomains = [...new Set(allRows.map((r) => r.wellbeingDomain))].sort()

    console.log("[v0] Unique strengths:", uniqueStrengths)
    console.log("[v0] Unique wellbeing domains:", uniqueDomains)
    console.log("[v0] Total prompts:", allRows.length)

    // Check current database themes
    const { data: themes, error } = await supabase.from("themes").select("name").order("name")

    if (error) {
      console.log("[v0] Error fetching themes:", error)
    } else {
      console.log(
        "[v0] Current themes in database:",
        themes?.map((t) => t.name),
      )
    }
  } catch (error) {
    console.error("[v0] Error analyzing CSV:", error)
  }
}

analyzeCsvData()
