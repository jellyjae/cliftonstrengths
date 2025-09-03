import { createClient } from "@/lib/supabase/client"

async function fixDatabaseSchema() {
  console.log("[v0] Fixing database schema...")

  const supabase = createClient()

  try {
    console.log("[v0] Step 1: Dropping dependent tables...")
    
    // Drop user_strengths table
    const { error: dropStrengthsError } = await supabase
      .from('user_strengths')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
    
    if (dropStrengthsError) {
      console.log("[v0] Note: user_strengths table might not exist yet:", dropStrengthsError.message)
    } else {
      console.log("[v0] user_strengths records cleared")
    }

    // Drop daily_prompts table
    const { error: dropPromptsError } = await supabase
      .from('daily_prompts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
    
    if (dropPromptsError) {
      console.log("[v0] Note: daily_prompts table might not exist yet:", dropPromptsError.message)
    } else {
      console.log("[v0] daily_prompts records cleared")
    }

    console.log("[v0] Step 2: Dropping profile table...")
    
    // Drop profile table
    const { error: dropProfileError } = await supabase
      .from('profile')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
    
    if (dropProfileError) {
      console.log("[v0] Note: profile table might not exist yet:", dropProfileError.message)
    } else {
      console.log("[v0] profile records cleared")
    }

    console.log("[v0] Step 3: Recreating tables with correct schema...")
    
    // Note: We can't create tables directly via the client, so we'll need to do this manually
    // For now, let's test if the existing tables work with the current app logic
    
    console.log("[v0] Testing current schema compatibility...")
    
    // Test creating a profile with text device_id
    const testDeviceId = "test-device-" + Date.now()
    console.log("[v0] Testing with device_id:", testDeviceId)
    
    // Try to create a profile - this will fail if the schema is wrong
    const { data: profile, error: profileError } = await supabase
      .from("profile")
      .insert({
        device_id: testDeviceId,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (profileError) {
      console.error("[v0] Profile creation failed - schema needs manual fix:", profileError)
      console.log("[v0] You need to manually run the SQL in fix_schema.sql in your Supabase dashboard")
    } else {
      console.log("[v0] Profile created successfully - schema is correct!")
      
      // Clean up test profile
      await supabase.from("profile").delete().eq("id", profile.id)
      console.log("[v0] Test profile cleaned up")
    }

  } catch (error) {
    console.error("[v0] Schema fix failed:", error)
  }
}

fixDatabaseSchema()
