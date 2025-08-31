const https = require("https")

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

// CSV URL
const CSV_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/strengths_wellbeing_prompts_final-c1SNyuU84TqIOTdAEEaMReL0XJ5sd8.csv"

// Wellbeing domain mapping
const DOMAIN_MAPPING = {
  Career: "career",
  Social: "social",
  Financial: "financial",
  Physical: "physical",
  Community: "community",
}

// Function to make HTTP requests
function fetchData(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = ""
        res.on("data", (chunk) => (data += chunk))
        res.on("end", () => resolve(data))
      })
      .on("error", reject)
  })
}

// Function to make Supabase API calls
async function supabaseQuery(endpoint, method = "GET", body = null) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`
  const options = {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
  }

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = ""
      res.on("data", (chunk) => (data += chunk))
      res.on("end", () => {
        try {
          const result = data ? JSON.parse(data) : null
          resolve({ data: result, status: res.statusCode })
        } catch (e) {
          resolve({ data: data, status: res.statusCode })
        }
      })
    })

    req.on("error", reject)

    if (body) {
      req.write(JSON.stringify(body))
    }

    req.end()
  })
}

// Simple CSV parser
function parseCSV(csvText) {
  const lines = csvText.trim().split("\n")
  const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim())

  return lines.slice(1).map((line) => {
    const values = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        values.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }
    values.push(current.trim())

    const row = {}
    headers.forEach((header, index) => {
      row[header] = values[index] ? values[index].replace(/"/g, "") : ""
    })
    return row
  })
}

async function main() {
  try {
    console.log("Fetching CSV data...")
    const csvData = await fetchData(CSV_URL)
    console.log(`CSV data fetched: ${csvData.length} characters`)

    console.log("Parsing CSV...")
    const rows = parseCSV(csvData)
    console.log(`Parsed ${rows.length} rows`)

    // Show sample data
    console.log("Sample row:", rows[0])

    // Get all themes from database
    console.log("Fetching themes from database...")
    const themesResponse = await supabaseQuery("themes?select=id,name")

    if (themesResponse.status !== 200) {
      throw new Error(`Failed to fetch themes: ${themesResponse.status} ${JSON.stringify(themesResponse.data)}`)
    }

    const themes = themesResponse.data
    console.log(`Found ${themes.length} themes in database`)

    // Create theme name to ID mapping
    const themeMap = {}
    themes.forEach((theme) => {
      themeMap[theme.name] = theme.id
    })

    // Process CSV rows
    const validPrompts = []
    const errors = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const strength = row["Strength"]?.trim()
      const domain = row["Wellbeing Domain"]?.trim()
      const prompt = row["Prompt"]?.trim()

      if (!strength || !domain || !prompt) {
        errors.push(`Row ${i + 1}: Missing required fields`)
        continue
      }

      const themeId = themeMap[strength]
      if (!themeId) {
        errors.push(`Row ${i + 1}: Unknown strength "${strength}"`)
        continue
      }

      const aspect = DOMAIN_MAPPING[domain]
      if (!aspect) {
        errors.push(`Row ${i + 1}: Unknown wellbeing domain "${domain}"`)
        continue
      }

      validPrompts.push({
        theme_id: themeId,
        aspect: aspect,
        prompt_text: prompt,
        tags: [],
      })
    }

    console.log(`Valid prompts: ${validPrompts.length}`)
    console.log(`Errors: ${errors.length}`)

    if (errors.length > 0) {
      console.log("First 5 errors:")
      errors.slice(0, 5).forEach((error) => console.log(`  ${error}`))
    }

    if (validPrompts.length === 0) {
      console.log("No valid prompts to import")
      return
    }

    // Insert prompts in batches
    console.log("Inserting prompts into database...")
    const batchSize = 100
    let inserted = 0
    let skipped = 0

    for (let i = 0; i < validPrompts.length; i += batchSize) {
      const batch = validPrompts.slice(i, i + batchSize)

      try {
        const response = await supabaseQuery("prompts", "POST", batch)

        if (response.status === 201) {
          inserted += batch.length
          console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} prompts`)
        } else if (response.status === 409) {
          skipped += batch.length
          console.log(`Skipped batch ${Math.floor(i / batchSize) + 1}: ${batch.length} duplicates`)
        } else {
          console.error(`Batch ${Math.floor(i / batchSize) + 1} failed:`, response.status, response.data)
        }
      } catch (error) {
        console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message)
      }
    }

    console.log("\n=== IMPORT SUMMARY ===")
    console.log(`Total rows processed: ${rows.length}`)
    console.log(`Valid prompts: ${validPrompts.length}`)
    console.log(`Successfully inserted: ${inserted}`)
    console.log(`Skipped (duplicates): ${skipped}`)
    console.log(`Errors: ${errors.length}`)

    // Verify the import
    console.log("\nVerifying import...")
    const countResponse = await supabaseQuery("prompts?select=count")
    if (countResponse.status === 200) {
      console.log(`Total prompts in database: ${countResponse.data[0]?.count || "unknown"}`)
    }
  } catch (error) {
    console.error("Import failed:", error.message)
    process.exit(1)
  }
}

main()
