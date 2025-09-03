import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Testing database connection...")
    
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ 
        error: "Missing environment variables",
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }, { status: 500 })
    }

    const supabase = await createClient()
    
    // Test basic connection
    const { data: themes, error: themesError } = await supabase
      .from("themes")
      .select("id, name")
      .limit(5)

    if (themesError) {
      console.error("[v0] Database error:", themesError)
      return NextResponse.json({ 
        error: "Database connection failed",
        details: themesError.message
      }, { status: 500 })
    }

    // Test profile table
    const { data: profiles, error: profilesError } = await supabase
      .from("profile")
      .select("id")
      .limit(1)

    if (profilesError) {
      console.error("[v0] Profile table error:", profilesError)
      return NextResponse.json({ 
        error: "Profile table access failed",
        details: profilesError.message
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      themesCount: themes?.length || 0,
      sampleThemes: themes,
      databaseConnected: true
    })

  } catch (error) {
    console.error("[v0] Test database error:", error)
    return NextResponse.json({ 
      error: "Database test failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
