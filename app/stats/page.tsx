"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ArrowLeft, TrendingUp, Target, Calendar } from "lucide-react"
import { getDeviceId } from "@/lib/device-id"
import { getCompletionsByAspect, getCompletionsByStrength } from "@/lib/actions/stats-actions"
import { getStreakData } from "@/lib/actions/completion-actions"

const TIME_RANGES = [
  { label: "7 Days", value: 7 },
  { label: "30 Days", value: 30 },
  { label: "90 Days", value: 90 },
]

const ASPECT_COLORS = {
  career: "#3b82f6",
  social: "#10b981",
  financial: "#f59e0b",
  physical: "#ef4444",
  community: "#8b5cf6",
}

const ASPECT_LABELS = {
  career: "Career",
  social: "Social",
  financial: "Financial",
  physical: "Physical",
  community: "Community",
}

export default function StatsPage() {
  const [aspectData, setAspectData] = useState<any>(null)
  const [strengthData, setStrengthData] = useState<any[]>([])
  const [streakData, setStreakData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRange, setSelectedRange] = useState(30)
  const router = useRouter()
  const searchParams = useSearchParams()

  const loadStatsData = useCallback(async () => {
    try {
      console.log("[v0] Loading stats data for range:", selectedRange)
      setLoading(true)
      setError(null)

      const deviceId = getDeviceId()
      if (!deviceId) {
        router.push("/onboarding")
        return
      }

      const [aspectResult, strengthResult, streakResult] = await Promise.all([
        getCompletionsByAspect(deviceId, selectedRange),
        getCompletionsByStrength(deviceId, selectedRange),
        getStreakData(deviceId),
      ])

      console.log("[v0] Stats data loaded successfully")
      setAspectData(aspectResult)
      setStrengthData(strengthResult)
      setStreakData(streakResult)
    } catch (error) {
      console.error("[v0] Error loading stats:", error)
      setError("Unable to load stats data. Please try again later.")
      setAspectData({ aspectCounts: {}, completionRate: 0, totalCompleted: 0, totalPossible: 0 })
      setStrengthData([])
      setStreakData({ currentStreak: 0, longestStreak: 0, totalCompleteDays: 0 })
    } finally {
      setLoading(false)
    }
  }, [selectedRange, router])

  useEffect(() => {
    const rangeParam = searchParams.get("range")
    if (rangeParam) {
      const range = Number.parseInt(rangeParam)
      if (TIME_RANGES.some((r) => r.value === range) && range !== selectedRange) {
        setSelectedRange(range)
      }
    }
  }, [searchParams, selectedRange])

  useEffect(() => {
    loadStatsData()
  }, [loadStatsData])

  const handleRangeChange = (range: number) => {
    if (range === selectedRange) return // Prevent unnecessary updates

    setSelectedRange(range)

    const url = new URL(window.location.href)
    url.searchParams.set("range", range.toString())
    window.history.replaceState({}, "", url.toString())
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-red-500 mb-4">⚠️</div>
              <h2 className="text-lg font-semibold mb-2">Unable to Load Stats</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your stats...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const aspectChartData = aspectData?.aspectCounts
    ? Object.entries(aspectData.aspectCounts).map(([aspect, count]) => ({
        aspect: ASPECT_LABELS[aspect as keyof typeof ASPECT_LABELS] || aspect,
        count: count as number,
        fill: ASPECT_COLORS[aspect as keyof typeof ASPECT_COLORS] || "#666",
      }))
    : []

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/today")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Today
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Your Stats</h1>
              <p className="text-muted-foreground">Track your wellbeing journey progress</p>
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Time Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {TIME_RANGES.map((range) => (
                <Button
                  key={range.value}
                  variant={selectedRange === range.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleRangeChange(range.value)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{streakData?.currentStreak || 0}</div>
              <p className="text-xs text-muted-foreground">consecutive days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Streak</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{streakData?.longestStreak || 0}</div>
              <p className="text-xs text-muted-foreground">days record</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <div className="h-4 w-4 rounded-full bg-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aspectData ? Math.round(aspectData.completionRate || 0) : 0}%</div>
              <p className="text-xs text-muted-foreground">
                {aspectData?.totalCompleted || 0} of {aspectData?.totalPossible || 0} prompts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Completions by Aspect */}
          <Card>
            <CardHeader>
              <CardTitle>Completions by Wellbeing Aspect</CardTitle>
              <CardDescription>
                Your focus across different areas of wellbeing over the last {selectedRange} days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {aspectChartData.length > 0 ? (
                <ChartContainer
                  config={{
                    count: {
                      label: "Completions",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={aspectChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="aspect" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No completions yet for this time period.</p>
                  <p className="text-sm">Start completing daily prompts to see your progress!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completions by Strength */}
          <Card>
            <CardHeader>
              <CardTitle>Completions by Strength</CardTitle>
              <CardDescription>
                Which of your CliftonStrengths you've engaged with most over the last {selectedRange} days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {strengthData.length > 0 ? (
                <div className="space-y-4">
                  {strengthData.map((strength, index) => (
                    <div key={strength.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <span className="font-medium">{strength.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min((strength.count / (strengthData[0]?.count || 1)) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{strength.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No completions yet for this time period.</p>
                  <p className="text-sm">Start completing daily prompts to see your strength engagement!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
