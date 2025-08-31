"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, RotateCcw, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StrengthSelector } from "@/components/strength-selector"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { createClient } from "@/lib/supabase/client"
import { getOrCreateDeviceId } from "@/lib/device-id"
import { updateUserStrengths, resetUserData, getCurrentUserStrengths } from "@/lib/actions/settings-actions"
import type { Theme } from "@/lib/types"

export default function SettingsPage() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [currentStrengths, setCurrentStrengths] = useState<Theme[]>([])
  const [selectedThemes, setSelectedThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClient()
      const deviceId = getOrCreateDeviceId()

      // Load themes
      const { data: themesData, error: themesError } = await supabase.from("themes").select("*").order("name")

      if (themesError) throw themesError

      // Load current strengths
      const currentStrengthsData = await getCurrentUserStrengths(deviceId)

      setThemes(themesData || [])
      setCurrentStrengths(currentStrengthsData)
      setSelectedThemes(currentStrengthsData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveStrengths = async () => {
    if (selectedThemes.length !== 5) return

    setSaving(true)
    try {
      const deviceId = getOrCreateDeviceId()
      await updateUserStrengths(
        deviceId,
        selectedThemes.map((t) => t.id),
      )

      setCurrentStrengths(selectedThemes)
      setEditMode(false)
      setShowSaveDialog(false)
    } catch (error) {
      console.error("Error saving strengths:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleResetData = async () => {
    setResetting(true)
    try {
      const deviceId = getOrCreateDeviceId()
      await resetUserData(deviceId)

      setShowResetDialog(false)
      router.push("/onboarding")
    } catch (error) {
      console.error("Error resetting data:", error)
    } finally {
      setResetting(false)
    }
  }

  const handleEditClick = () => {
    setSelectedThemes(currentStrengths)
    setEditMode(true)
  }

  const handleCancelEdit = () => {
    setSelectedThemes(currentStrengths)
    setEditMode(false)
  }

  const handleSaveClick = () => {
    if (selectedThemes.length !== 5) return
    setShowSaveDialog(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (editMode) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <h1 className="text-2xl font-bold">Edit Your Strengths</h1>
          </div>

          <StrengthSelector
            themes={themes}
            selectedThemes={selectedThemes}
            onSelectionChange={setSelectedThemes}
            onComplete={handleSaveClick}
          />
        </div>

        <ConfirmDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          title="Save Changes?"
          description="This will update your strengths and regenerate today's prompts. Your progress and streaks will be preserved."
          confirmText={saving ? "Saving..." : "Save Changes"}
          onConfirm={handleSaveStrengths}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        {/* Current Strengths */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Top 5 CliftonStrengths</CardTitle>
                <CardDescription>These strengths are used to personalise your daily wellbeing prompts.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleEditClick}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {currentStrengths.map((theme, index) => (
                <Badge key={theme.id} variant="secondary" className="px-3 py-1">
                  <span className="text-xs font-medium mr-1">#{index + 1}</span>
                  {theme.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reset Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Reset All Data</CardTitle>
            <CardDescription>
              This will permanently delete all your progress, including completed prompts, streaks, and selected
              strengths. You'll need to complete onboarding again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setShowResetDialog(true)} disabled={resetting}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {resetting ? "Resetting..." : "Reset All Data"}
            </Button>
          </CardContent>
        </Card>

        <ConfirmDialog
          open={showResetDialog}
          onOpenChange={setShowResetDialog}
          title="Reset All Data?"
          description="This action cannot be undone. All your progress, completions, streaks, and selected strengths will be permanently deleted. You'll be redirected to onboarding to start afresh."
          confirmText={resetting ? "Resetting..." : "Reset Everything"}
          onConfirm={handleResetData}
          destructive
        />
      </div>
    </div>
  )
}
