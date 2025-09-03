import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Debugging environment variables...")
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    // Check if URL is valid format
    let urlValid = false
    let urlError = null
    try {
      if (supabaseUrl) {
        new URL(supabaseUrl)
        urlValid = true
      }
    } catch (error) {
      urlError = error instanceof Error ? error.message : "Unknown URL error"
    }
    
    return NextResponse.json({ 
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseKey?.length || 0,
      urlPrefix: supabaseUrl?.substring(0, 30) + "...",
      keyPrefix: supabaseKey?.substring(0, 20) + "...",
      urlValid,
      urlError,
      expectedUrlFormat: "https://your-project-id.supabase.co",
      allSupabaseEnvVars: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
    })
    
  } catch (error) {
    console.error("[v0] Debug env error:", error)
    return NextResponse.json({ 
      error: "Debug failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
