import { type NextRequest, NextResponse } from "next/server"
import { getTodaysPrompts } from "@/lib/daily-selection"

export async function POST(request: NextRequest) {
  try {
    const { deviceId } = await request.json()

    if (!deviceId) {
      return NextResponse.json({ error: "Device ID required" }, { status: 400 })
    }

    const prompts = await getTodaysPrompts(deviceId)

    return NextResponse.json({ prompts })
  } catch (error) {
    console.error("Error generating daily prompts:", error)
    return NextResponse.json({ error: "Failed to generate daily prompts" }, { status: 500 })
  }
}
