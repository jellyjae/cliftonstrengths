"use client"

import { useState } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Theme } from "@/lib/types"

interface StrengthSelectorProps {
  themes: Theme[]
  selectedThemes: Theme[]
  onSelectionChange: (themes: Theme[]) => void
  onComplete: () => void
}

export function StrengthSelector({ themes, selectedThemes, onSelectionChange, onComplete }: StrengthSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")

  const filteredThemes = themes.filter(
    (theme) =>
      theme?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      theme?.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleThemeSelect = (theme: Theme) => {
    if (selectedThemes.find((t) => t.id === theme.id)) {
      // Remove if already selected
      onSelectionChange(selectedThemes.filter((t) => t.id !== theme.id))
    } else if (selectedThemes.length < 5) {
      // Add if under limit
      onSelectionChange([...selectedThemes, theme])
    }
    setError("")
  }

  const handleRemoveTheme = (themeId: string) => {
    onSelectionChange(selectedThemes.filter((t) => t.id !== themeId))
    setError("")
  }

  const handleComplete = () => {
    if (selectedThemes.length !== 5) {
      setError("Please select exactly 5 strengths to continue.")
      return
    }
    onComplete()
  }

  const isThemeSelected = (themeId: string) => selectedThemes.some((t) => t.id === themeId)

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Select Your Top 5 CliftonStrengths</CardTitle>
          <CardDescription className="text-center">
            Choose exactly 5 strengths that best represent your natural talents and abilities.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selected Strengths Pills */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">
              Selected Strengths ({selectedThemes.length}/5)
            </h3>
            <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-3 border rounded-lg bg-muted/30">
              {selectedThemes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No strengths selected yet</p>
              ) : (
                selectedThemes.map((theme, index) => (
                  <Badge key={theme.id} variant="default" className="flex items-center gap-1 px-3 py-1">
                    <span className="text-xs font-medium">#{index + 1}</span>
                    {theme.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive/20"
                      onClick={() => handleRemoveTheme(theme.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search strengths..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Themes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {filteredThemes.map((theme) => (
              <Card
                key={theme.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  isThemeSelected(theme.id) ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50",
                  selectedThemes.length >= 5 && !isThemeSelected(theme.id) ? "opacity-50 cursor-not-allowed" : "",
                )}
                onClick={() => handleThemeSelect(theme)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">{theme.name}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{theme.description}</p>
                    </div>
                    {isThemeSelected(theme.id) && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        #{selectedThemes.findIndex((t) => t.id === theme.id) + 1}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Error Message */}
          {error && <p className="text-sm text-destructive text-centre">{error}</p>}

          {/* Complete Button */}
          <Button onClick={handleComplete} className="w-full" disabled={selectedThemes.length !== 5}>
            Complete Selection ({selectedThemes.length}/5)
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
