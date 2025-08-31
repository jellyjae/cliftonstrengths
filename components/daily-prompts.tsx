"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, RefreshCw } from "lucide-react"
import { getDeviceId } from "@/lib/device-id"
import type { DailyPrompt } from "@/lib/types"

const ASPECT_LABELS = {
  career: "Career",
  social: "Social",
  financial: "Financial",
  physical: "Physical",
  community: "Community",
}

const ASPECT_COLORS = {
  career: "bg-blue-100 text-blue-800",
  social: "bg-green-100 text-green-800",
  financial: "bg-yellow-100 text-yellow-800",
  physical: "bg-red-100 text-red-800",
  community: "bg-purple-100 text-purple-800",
}

export function DailyPrompts() {
  const [prompts, setPrompts] = useState<DailyPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [completedPrompts, setCompletedPrompts] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadTodaysPrompts()
  }, [])

  const loadTodaysPrompts = async () => {
    try {
      setLoading(true)
      const deviceId = getDeviceId()
      if (!deviceId) return

      const response = await fetch("/api/daily-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      })

      if (response.ok) {
        const data = await response.json()
        setPrompts(data.prompts || [])
      }
    } catch (error) {
      console.error("Error loading daily prompts:", error)
    } finally {
      setLoading(false)
    }
  }

  const togglePromptCompletion = (promptId: string) => {
    setCompletedPrompts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(promptId)) {
        newSet.delete(promptId)
      } else {
        newSet.add(promptId)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading today's prompts...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (prompts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center p-8">
          <p className="text-muted-foreground mb-4">No prompts available for today.</p>
          <Button onClick={loadTodaysPrompts} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    )
  }

  const completedCount = completedPrompts.size
  const totalCount = prompts.length

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Today's Wellbeing Prompts</span>
            <Badge variant="secondary">
              {completedCount}/{totalCount} Complete
            </Badge>
          </CardTitle>
          <CardDescription>
            Five personalized prompts based on your CliftonStrengths to support your wellbeing today.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prompts.map((dailyPrompt) => {
          const isCompleted = completedPrompts.has(dailyPrompt.id)
          const aspect = dailyPrompt.aspect

          return (
            <Card
              key={dailyPrompt.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isCompleted ? "ring-2 ring-green-500 bg-green-50" : ""
              }`}
              onClick={() => togglePromptCompletion(dailyPrompt.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <Badge className={ASPECT_COLORS[aspect]}>{ASPECT_LABELS[aspect]}</Badge>
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium text-muted-foreground mb-1">{dailyPrompt.theme?.name}</p>
                  <p className="text-sm leading-relaxed">{dailyPrompt.prompt?.prompt_text}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {completedCount === totalCount && totalCount > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="text-center p-6">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold text-green-800 mb-2">Great job!</h3>
            <p className="text-green-700">You've completed all of today's wellbeing prompts.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
