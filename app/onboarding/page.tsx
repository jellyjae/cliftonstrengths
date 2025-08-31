"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getThemes } from "@/lib/actions/theme-actions"
import { getOrCreateDeviceId } from "@/lib/device-id"
import { StrengthSelector } from "@/components/strength-selector"
import type { Theme } from "@/lib/types"
import { Sparkles } from "lucide-react"

export default function OnboardingPage() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [selectedThemes, setSelectedThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadThemes()
  }, [])

  const loadThemes = async () => {
    try {
      console.log("[v0] Loading themes via server action...")
      const { data, error } = await getThemes()

      if (error) {
        console.error("Error loading themes:", error)
        setError("Unable to load CliftonStrengths themes. Please check your database connection.")
      } else if (!data || data.length === 0) {
        setError("No CliftonStrengths themes found. Please check your database setup.")
      } else {
        setThemes(data)
        setError(null)
        console.log("[v0] Loaded themes:", data.length, "themes available")
      }
    } catch (error) {
      console.error("Error loading themes:", error)
      setError(`Unable to connect to the database: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    if (selectedThemes.length !== 5) return

    setSaving(true)
    try {
      const deviceId = getOrCreateDeviceId()
      const strengthsData = selectedThemes.map((theme, index) => ({
        theme_id: theme.id,
        theme_name: theme.name,
        rank: index + 1,
      }))

      localStorage.setItem("user_strengths", JSON.stringify(strengthsData))
      localStorage.setItem("onboarding_completed", "true")
      localStorage.setItem("device_id", deviceId)

      console.log("[v0] Successfully saved strengths to localStorage:", strengthsData)
      router.push("/")
    } catch (error) {
      console.error("Error saving strengths:", error)
      setError("Unable to save your selections. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-centre">
        <div className="text-centre">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading strengths...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-centre">
        <div className="text-centre max-w-md mx-auto p-6">
          <div className="text-destructive mb-4">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Connection Issue</h2>
          <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setLoading(true)
              loadThemes()
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (saving) {
    return (
      <div className="min-h-screen flex items-center justify-centre">
        <div className="text-centre">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Saving your strengths...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5"></div>
        <div className="relative max-w-4xl mx-auto px-6 py-12 text-center">
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium">Getting Started</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-balance">
              Let's discover your
              <span className="text-primary"> unique strengths</span>
            </h1>
            <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed">
              Choose your top 5 CliftonStrengths to create a personalised wellbeing experience that celebrates what
              makes you brilliant.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-12">
        <StrengthSelector
          themes={themes}
          selectedThemes={selectedThemes}
          onSelectionChange={setSelectedThemes}
          onComplete={handleComplete}
        />
      </div>
    </div>
  )
}
