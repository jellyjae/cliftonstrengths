"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, RefreshCw, Calendar, AlertTriangle, Home, BarChart3 } from "lucide-react"
import { getDeviceId } from "@/lib/device-id"
import { togglePromptCompletion, getTodaysCompletions } from "@/lib/actions/completion-actions"
import type { DailyPrompt } from "@/lib/types"
import { StreakBanner } from "@/components/streak-banner"
import { OfflineCache } from "@/lib/offline-cache"
import { DayBoundaryManager } from "@/lib/day-boundary"
import { ConfettiCelebration } from "@/components/confetti-celebration"

const ASPECT_LABELS = {
  career: "Career",
  social: "Social",
  financial: "Financial",
  physical: "Physical",
  community: "Community",
}

const ASPECT_COLORS = {
  career: "bg-blue-100 text-black border-blue-200",
  social: "bg-green-100 text-black border-green-200",
  financial: "bg-yellow-100 text-black border-yellow-200",
  physical: "bg-red-100 text-black border-red-200",
  community: "bg-purple-100 text-black border-purple-200",
}

const ASPECT_RING_COLORS = {
  career: "text-blue-600",
  social: "text-green-600",
  financial: "text-yellow-600",
  physical: "text-red-600",
  community: "text-purple-600",
}

export default function TodayPage() {
  const [prompts, setPrompts] = useState<DailyPrompt[]>([])
  const [completions, setCompletions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const router = useRouter()

  const today = OfflineCache.getTodayDateString()
  const todayFormatted = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      loadTodaysData()
    }
    const handleOffline = () => setIsOffline(true)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    setIsOffline(!navigator.onLine)

    const cleanupDayBoundary = DayBoundaryManager.setupMidnightListener(() => {
      console.log("[v0] Day boundary crossed, refreshing data")
      OfflineCache.clearCache()
      loadTodaysData()
    })

    loadTodaysData()

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      cleanupDayBoundary()
    }
  }, [])

  // Trigger confetti when all prompts are completed
  useEffect(() => {
    const completedCount = completions.size
    const totalCount = prompts.length
    if (totalCount > 0 && completedCount === totalCount && !showConfetti) {
      setShowConfetti(true)
    }
  }, [completions, prompts.length, showConfetti])

  const loadTodaysData = async () => {
    try {
      setLoading(true)
      setError(null)

      const deviceId = getDeviceId()
      if (!deviceId) {
        router.push("/onboarding")
        return
      }

      // Check if user has completed onboarding by looking for saved strengths
      const savedStrengths = localStorage.getItem("user_strengths")
      const onboardingCompleted = localStorage.getItem("onboarding_completed")
      
      if (!savedStrengths || !onboardingCompleted) {
        console.log("[v0] User hasn't completed onboarding, redirecting...")
        router.push("/onboarding")
        return
      }

      // If we have localStorage data but no database profile, try to recreate it
      try {
        const strengthsData = JSON.parse(savedStrengths)
        if (strengthsData && strengthsData.length === 5) {
          // Check if the theme_id is a valid UUID format
          const hasValidUUIDs = strengthsData.every((strength: any) => 
            typeof strength.theme_id === 'string' && 
            strength.theme_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
          )
          
          if (!hasValidUUIDs) {
            console.log("[v0] Invalid UUID format in localStorage, clearing and redirecting to onboarding")
            localStorage.removeItem("user_strengths")
            localStorage.removeItem("onboarding_completed")
            router.push("/onboarding")
            return
          }
          
          console.log("[v0] Found localStorage strengths, attempting to recreate database profile...")
          
          // Import the createUserProfile function
          const { createUserProfile } = await import("@/lib/actions/user-actions")
          
          // Convert localStorage format to database format
          const strengthsForDB = strengthsData.map((strength: any) => ({
            theme_id: strength.theme_id,
            rank: strength.rank
          }))
          
          const result = await createUserProfile(deviceId, strengthsForDB)
          if (result.error) {
            console.log("[v0] Failed to recreate profile:", result.error)
          } else {
            console.log("[v0] Successfully recreated profile from localStorage")
          }
        }
      } catch (error) {
        console.log("[v0] Error recreating profile from localStorage:", error)
      }

      const cachedData = OfflineCache.getCachedData()
      if (cachedData && cachedData.prompts.length > 0) {
        console.log("[v0] Loading from cache for quick paint")
        setPrompts(cachedData.prompts)
        setCompletions(new Set(cachedData.completions))
        setLoading(false)

        if (!navigator.onLine) {
          setIsOffline(true)
          return
        }
      }

      if (navigator.onLine) {
        const promptsResponse = await fetch("/api/daily-prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId }),
        })

        if (promptsResponse.ok) {
          const promptsData = await promptsResponse.json()
          const freshPrompts = promptsData.prompts || []
          setPrompts(freshPrompts)

          if (freshPrompts.length > 0) {
            const promptThemes = freshPrompts.map((p: any) => ({ aspect: p.aspect, theme: p.theme?.name }))
            console.log("[v0] Loaded prompt themes by aspect:", promptThemes)
          }

          try {
            const completionsData = await getTodaysCompletions(deviceId, today)
            const completedPromptIds = completionsData.map((c: any) => c.prompt_id)
            setCompletions(new Set(completedPromptIds))

            OfflineCache.setCachedData(freshPrompts, completedPromptIds)
          } catch (completionError) {
            console.error("[v0] Failed to load completions:", completionError)
            setError("Database connection unavailable - completions won't be saved")
          }
        } else {
          const errorData = await promptsResponse.json().catch(() => ({ error: "Unknown error" }))
          setError(`Failed to load prompts: ${errorData.error || "Server error"}`)
        }
      } else if (!cachedData) {
        setError("No cached data available and you're offline. Please connect to the internet.")
      }
    } catch (error) {
      console.error("[v0] Error loading today's data:", error)
      const cachedData = OfflineCache.getCachedData()
      if (cachedData && cachedData.prompts.length > 0) {
        setPrompts(cachedData.prompts)
        setCompletions(new Set(cachedData.completions))
        setError("Using offline data - some features may be limited")
      } else {
        setError("Failed to load today's data. Please check your connection and try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const clearAndRegenerate = async () => {
    const deviceId = getDeviceId()
    if (!deviceId) return

    try {
      setLoading(true)
      const response = await fetch("/api/clear-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      })

      if (response.ok) {
        console.log("[v0] Prompts cleared, regenerating...")
        await loadTodaysData()
      } else {
        setError("Failed to clear prompts")
      }
    } catch (error) {
      console.error("[v0] Error clearing prompts:", error)
      setError("Failed to clear prompts")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleCompletion = async (promptId: string, aspect: string) => {
    const deviceId = getDeviceId()
    if (!deviceId) return

    const todayDate = OfflineCache.getTodayDateString()
    if (todayDate !== today) {
      console.error("Attempted to toggle completion for a different day.")
      return
    }

    const wasCompleted = completions.has(promptId)
    const newCompletions = new Set(completions)
    if (wasCompleted) {
      newCompletions.delete(promptId)
    } else {
      newCompletions.add(promptId)
    }
    setCompletions(newCompletions)

    OfflineCache.updateCompletions(Array.from(newCompletions))

    if (navigator.onLine) {
      startTransition(async () => {
        try {
          await togglePromptCompletion(deviceId, promptId, aspect, today)
          setError(null)
        } catch (error) {
          setCompletions((prev) => {
            const rollbackSet = new Set(prev)
            if (wasCompleted) {
              rollbackSet.add(promptId)
            } else {
              rollbackSet.delete(promptId)
            }
            OfflineCache.updateCompletions(Array.from(rollbackSet))
            return rollbackSet
          })
          console.error("[v0] Failed to toggle completion:", error)
          setError("Unable to save completion. Database connection unavailable.")
        }
      })
    } else {
      setError("Changes saved locally - will sync when back online")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading today's prompts...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const completedCount = completions.size
  const totalCount = prompts.length
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <ConfettiCelebration 
        show={showConfetti} 
        duration={4000}
        onComplete={() => setShowConfetti(false)}
      />
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/")}
              className="flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/stats")}
              className="flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <BarChart3 className="h-4 w-4" />
              Stats
            </Button>
          </div>
          {isOffline && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Offline Mode
            </Badge>
          )}
        </div>

        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">{todayFormatted}</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-balance">Your Daily Sanctuary</h1>
          <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
            Five mindful moments designed around your unique strengths
          </p>
        </div>

        {error && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <StreakBanner />

        <div className="flex justify-center">
          <div className="relative w-28 h-28">
            <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                className="text-muted-foreground/20"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={`${progressPercentage * 2.51} 251`}
                className="text-primary transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-2xl font-bold text-primary">{completedCount}</span>
                <span className="text-lg text-muted-foreground">/{totalCount}</span>
              </div>
            </div>
          </div>
        </div>

        {prompts.length === 0 ? (
          <Card className="bg-gradient-to-br from-card to-card/50">
            <CardContent className="text-center p-8">
              <p className="text-muted-foreground mb-4">No prompts available for today.</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={loadTodaysData} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={clearAndRegenerate} variant="outline">
                  Clear & Regenerate
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <Button onClick={clearAndRegenerate} variant="outline" size="sm">
                Clear & Regenerate Prompts
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {prompts.map((dailyPrompt) => {
                const isCompleted = completions.has(dailyPrompt.prompt?.id || "")
                const aspect = dailyPrompt.aspect

                return (
                  <Card
                    key={dailyPrompt.id}
                    className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                      isCompleted
                        ? "ring-2 ring-primary bg-gradient-to-br from-primary/5 to-primary/10"
                        : "bg-gradient-to-br from-card to-card/50"
                    } ${isPending ? "opacity-70" : ""}`}
                    onClick={() => handleToggleCompletion(dailyPrompt.prompt?.id || "", aspect)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <Badge className={`${ASPECT_COLORS[aspect]} font-medium`} variant="outline">
                          {ASPECT_LABELS[aspect]}
                        </Badge>
                        {isCompleted ? (
                          <CheckCircle2 className="h-6 w-6 text-primary" />
                        ) : (
                          <Circle className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="text-xs bg-secondary/10 text-secondary border-secondary/20"
                          >
                            {dailyPrompt.theme?.name}
                          </Badge>
                        </div>

                        <p className="text-sm leading-relaxed font-medium text-balance">
                          {dailyPrompt.prompt?.prompt_text}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        )}

        {completedCount === totalCount && totalCount > 0 && (
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="text-center p-8">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 rounded-full bg-primary/20">
                    <CheckCircle2 className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-balance">Wonderful work!</h3>
                <p className="text-muted-foreground text-balance max-w-md mx-auto leading-relaxed">
                  You've completed all of today's wellbeing prompts. Take a moment to appreciate this investment in
                  yourself.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}