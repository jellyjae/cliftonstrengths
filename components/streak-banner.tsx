"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flame, Trophy, Calendar } from "lucide-react"
import { getDeviceId } from "@/lib/device-id"
import { getStreakData } from "@/lib/actions/completion-actions"

interface StreakData {
  currentStreak: number
  longestStreak: number
  totalCompleteDays: number
}

export function StreakBanner() {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    totalCompleteDays: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStreakData()
  }, [])

  const loadStreakData = async () => {
    try {
      const deviceId = getDeviceId()
      if (!deviceId) return

      console.log("[v0] Loading streak data for device:", deviceId)
      const data = await getStreakData(deviceId)
      console.log("[v0] Streak data loaded:", data)
      setStreakData(data)
    } catch (error) {
      console.error("Error loading streak data:", error)
      try {
        const deviceId = getDeviceId()
        const completions = JSON.parse(localStorage.getItem(`completions_${deviceId}`) || "{}")
        const completedDates = Object.keys(completions).filter((date) =>
          Object.values(completions[date] || {}).some((completed) => completed),
        )

        // Calculate current streak from localStorage
        let currentStreak = 0
        const today = new Date().toISOString().split("T")[0]
        const checkDate = new Date(today)

        while (currentStreak < completedDates.length) {
          const dateStr = checkDate.toISOString().split("T")[0]
          if (completedDates.includes(dateStr)) {
            currentStreak++
            checkDate.setDate(checkDate.getDate() - 1)
          } else {
            break
          }
        }

        const fallbackData = {
          currentStreak,
          longestStreak: Math.max(currentStreak, completedDates.length),
          totalCompleteDays: completedDates.length,
        }

        console.log("[v0] Using localStorage fallback streak data:", fallbackData)
        setStreakData(fallbackData)
      } catch (localStorageError) {
        console.error("Error loading from localStorage:", localStorageError)
        setStreakData({
          currentStreak: 0,
          longestStreak: 0,
          totalCompleteDays: 0,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const refreshStreakData = () => {
    setLoading(true)
    loadStreakData()
  }

  useEffect(() => {
    ;(window as any).refreshStreakData = refreshStreakData
    return () => {
      delete (window as any).refreshStreakData
    }
  }, [])

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading streak...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-sm font-medium">Current Streak</div>
                <div className="text-2xl font-bold text-orange-600">{streakData.currentStreak}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-sm font-medium">Best Streak</div>
                <div className="text-2xl font-bold text-yellow-600">{streakData.longestStreak}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-sm font-medium">Total Days</div>
                <div className="text-2xl font-bold text-blue-600">{streakData.totalCompleteDays}</div>
              </div>
            </div>
          </div>

          {streakData.currentStreak > 0 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              🔥 Brilliant!
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
