import { createClient } from "@/lib/supabase/client"

async function testDatabaseConnection() {
  console.log("[v0] Testing database connection...")

  const supabase = createClient()

  try {
    // Test 1: Load themes
    console.log("[v0] Testing themes table...")
    const { data: themes, error: themesError } = await supabase.from("themes").select("*").order("name")

    if (themesError) {
      console.error("[v0] Themes error:", themesError)
    } else {
      console.log("[v0] Themes loaded successfully:", themes?.length, "themes found")
      console.log(
        "[v0] First few themes:",
        themes?.slice(0, 3).map((t) => t.name),
      )
    }

    // Test 2: Check if we can create a profile
    console.log("[v0] Testing profile creation...")
    const testDeviceId = "test-device-" + Date.now()

    const { data: profile, error: profileError } = await supabase
      .from("profile")
      .upsert(
        {
          device_id: testDeviceId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "device_id" },
      )
      .select()
      .single()

    if (profileError) {
      console.error("[v0] Profile error:", profileError)
    } else {
      console.log("[v0] Profile created successfully:", profile)

      // Clean up test profile
      await supabase.from("profile").delete().eq("id", profile.id)
      console.log("[v0] Test profile cleaned up")
    }
  } catch (error) {
    console.error("[v0] Database connection test failed:", error)
  }
}

testDatabaseConnection()
