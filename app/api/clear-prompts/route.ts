import { type NextRequest, NextResponse } from "next/server"
import { clearTodaysPrompts } from "@/lib/daily-selection"

export async function POST(request: NextRequest) {
  try {
    const { deviceId } = await request.json()

    if (!deviceId) {
      return NextResponse.json({ error: "Device ID required" }, { status: 400 })
    }

    const success = await clearTodaysPrompts(deviceId)

    if (success) {
      return NextResponse.json({ message: "Today's prompts cleared successfully" })
    } else {
      return NextResponse.json({ error: "Failed to clear prompts" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error clearing daily prompts:", error)
    return NextResponse.json({ error: "Failed to clear daily prompts" }, { status: 500 })
  }
}
