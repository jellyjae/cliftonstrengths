"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getDeviceId } from "@/lib/device-id"
import { getUserStrengths } from "@/lib/actions/user-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Calendar, BarChart3, Settings, AlertCircle, Sparkles } from "lucide-react"
import type { UserStrength } from "@/lib/types"

export default function HomePage() {
  const [userStrengths, setUserStrengths] = useState<UserStrength[]>([])
  const [loading, setLoading] = useState(true)
  const [databaseError, setDatabaseError] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkUserStrengths()
  }, [])

  const checkUserStrengths = async () => {
    try {
      const deviceId = getDeviceId()
      if (!deviceId) {
        router.push("/onboarding")
        return
      }

      // Try server action first
      const { data: serverStrengths, hasProfile } = await getUserStrengths()

      if (serverStrengths && serverStrengths.length === 5) {
        console.log("[v0] Successfully loaded strengths from server:", serverStrengths)
        setUserStrengths(serverStrengths)
        setLoading(false)
        return
      }

      // Fallback to localStorage
      const savedStrengths = localStorage.getItem("user_strengths")
      const onboardingCompleted = localStorage.getItem("onboarding_completed")

      if (savedStrengths && onboardingCompleted) {
        const strengthsData = JSON.parse(savedStrengths)
        const formattedStrengths = strengthsData.map((strength: any) => ({
          id: strength.theme_id,
          rank: strength.rank,
          theme: {
            id: strength.theme_id,
            name: strength.theme_name,
            description: getThemeDescription(strength.theme_name),
          },
        }))
        console.log("[v0] Successfully loaded strengths from localStorage:", formattedStrengths)
        setUserStrengths(formattedStrengths)
        setDatabaseError(true)
        setLoading(false)
        return
      }

      // No strengths found, redirect to onboarding
      router.push("/onboarding")
    } catch (error) {
      console.error("Error checking user strengths:", error)

      // Fallback to localStorage on error
      const savedStrengths = localStorage.getItem("user_strengths")
      const onboardingCompleted = localStorage.getItem("onboarding_completed")

      if (savedStrengths && onboardingCompleted) {
        const strengthsData = JSON.parse(savedStrengths)
        const formattedStrengths = strengthsData.map((strength: any) => ({
          id: strength.theme_id,
          rank: strength.rank,
          theme: {
            id: strength.theme_id,
            name: strength.theme_name,
            description: getThemeDescription(strength.theme_name),
          },
        }))
        setUserStrengths(formattedStrengths)
        setDatabaseError(true)
      } else {
        router.push("/onboarding")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEditStrengths = () => {
    router.push("/settings")
  }

  const handleViewToday = () => {
    router.push("/today")
  }

  const handleViewStats = () => {
    router.push("/stats")
  }

  const handleViewSettings = () => {
    router.push("/settings")
  }

  const getThemeDescription = (themeName: string): string => {
    const descriptions: { [key: string]: string } = {
      Achiever: "People exceptionally talented in the Achiever theme work hard and possess a great deal of stamina.",
      Activator:
        "People exceptionally talented in the Activator theme can make things happen by turning thoughts into action.",
      Adaptability: "People exceptionally talented in the Adaptability theme prefer to go with the flow.",
      Analytical: "People exceptionally talented in the Analytical theme search for reasons and causes.",
      Arranger:
        "People exceptionally talented in the Arranger theme can organize, but they also have a flexibility that complements this ability.",
      Belief: "People exceptionally talented in the Belief theme have certain core values that are unchanging.",
      Command:
        "People exceptionally talented in the Command theme have presence. They can take control of a situation and make decisions.",
      Communication:
        "People exceptionally talented in the Communication theme generally find it easy to put their thoughts into words.",
      Competition:
        "People exceptionally talented in the Competition theme measure their progress against the performance of others.",
      Connectedness:
        "People exceptionally talented in the Connectedness theme have faith in the links among all things.",
      Consistency:
        "People exceptionally talented in the Consistency theme are keenly aware of the need to treat people the same.",
      Context: "People exceptionally talented in the Context theme enjoy thinking about the past.",
      Deliberative:
        "People exceptionally talented in the Deliberative theme are best described by the serious care they take in making decisions.",
      Developer:
        "People exceptionally talented in the Developer theme recognize and cultivate the potential in others.",
      Discipline: "People exceptionally talented in the Discipline theme enjoy routine and structure.",
      Empathy:
        "People exceptionally talented in the Empathy theme can sense other people's feelings by imagining themselves in others' lives.",
      Focus:
        "People exceptionally talented in the Focus theme can take a direction, follow through, and make the corrections necessary to stay on track.",
      Futuristic: "People exceptionally talented in the Futuristic theme are inspired by the future and what could be.",
      Harmony: "People exceptionally talented in the Harmony theme look for consensus.",
      Ideation: "People exceptionally talented in the Ideation theme are fascinated by ideas.",
      Includer: "People exceptionally talented in the Includer theme accept others.",
      Individualization:
        "People exceptionally talented in the Individualization theme are intrigued with the unique qualities of each person.",
      Input: "People exceptionally talented in the Input theme have a craving to know more.",
      Intellection:
        "People exceptionally talented in the Intellection theme are characterized by their intellectual activity.",
      Learner:
        "People exceptionally talented in the Learner theme have a great desire to learn and want to continuously improve.",
      Maximizer:
        "People exceptionally talented in the Maximizer theme focus on strengths as a way to stimulate personal and group excellence.",
      Positivity: "People exceptionally talented in the Positivity theme have contagious enthusiasm.",
      Relator: "People exceptionally talented in the Relator theme enjoy close relationships with others.",
      Responsibility:
        "People exceptionally talented in the Responsibility theme take psychological ownership of what they say they will do.",
      Restorative: "People exceptionally talented in the Restorative theme are adept at dealing with problems.",
      "Self-Assurance":
        "People exceptionally talented in the Self-Assurance theme feel confident in their ability to manage their own lives.",
      Significance:
        "People exceptionally talented in the Significance theme want to be very important in others' eyes.",
      Strategic: "People exceptionally talented in the Strategic theme create alternative ways to proceed.",
      Woo: "People exceptionally talented in the Woo theme love the challenge of meeting new people and winning them over.",
    }
    return descriptions[themeName] || "A unique CliftonStrength that contributes to your personal excellence."
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your wellbeing journey...</p>
        </div>
      </div>
    )
  }

  if (databaseError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Connection Issue
              </CardTitle>
              <CardDescription>
                We're having trouble connecting to your data. Please check your settings and try again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-50">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today's Wellbeing Prompts
                </CardTitle>
                <CardDescription>
                  Start your day with personalised prompts based on your CliftonStrengths
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button disabled className="w-full sm:w-auto">
                  View Today's Prompts
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-secondary/5 border-secondary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Your Progress Stats
                </CardTitle>
                <CardDescription>Track your wellbeing journey and see your completion patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <Button disabled variant="secondary" className="w-full sm:w-auto">
                  View Stats Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-muted/5 border-muted/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Settings
                </CardTitle>
                <CardDescription>Edit your strengths or reset your data</CardDescription>
              </CardHeader>
              <CardContent>
                <Button disabled variant="outline" className="w-full sm:w-auto bg-transparent">
                  Manage Settings
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10"></div>
        <div className="relative max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-medium">Your Wellbeing Journey</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-balance leading-tight">
                Welcome to your
                <span className="text-primary"> daily sanctuary</span>
              </h1>
              <p className="text-lg text-muted-foreground text-balance leading-relaxed">
                Nurture your wellbeing with personalised prompts crafted around your unique CliftonStrengths. Take a
                moment each day to invest in yourself.
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-3xl"></div>
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/daniel-stiel-l0GF1Oj3JJY-unsplash.jpg-zHxkPjW8m8apyghkna3pfMb4Ux92bi.jpeg"
                alt="A peaceful moment with matcha tea being poured into a glass"
                className="relative rounded-3xl shadow-2xl w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-16 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="group hover:shadow-lg transition-all duration-300 border-primary/20 bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Today's Prompts</CardTitle>
              </div>
              <CardDescription className="text-balance">
                Start your day with five mindful prompts designed around your strengths
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleViewToday} className="w-full group-hover:scale-105 transition-transform">
                Begin Today's Journey
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-secondary/20 bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                  <BarChart3 className="h-5 w-5 text-secondary" />
                </div>
                <CardTitle className="text-lg">Your Progress</CardTitle>
              </div>
              <CardDescription className="text-balance">
                Celebrate your wellbeing journey and track your growth over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleViewStats}
                variant="secondary"
                className="w-full group-hover:scale-105 transition-transform"
              >
                View Your Stats
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-accent/20 bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <Settings className="h-5 w-5 text-accent" />
                </div>
                <CardTitle className="text-lg">Settings</CardTitle>
              </div>
              <CardDescription className="text-balance">
                Personalise your experience and manage your strength preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleViewSettings}
                variant="outline"
                size="lg"
                className="hover:scale-105 transition-transform bg-transparent"
              >
                Manage Settings
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-br from-card to-card/50 border-primary/10">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-balance">Your Unique CliftonStrengths</CardTitle>
            <CardDescription className="text-lg text-balance">
              These five talents shape your personalised wellbeing experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {userStrengths.map((strength, index) => (
                <Card
                  key={strength.id}
                  className="group hover:shadow-md transition-all duration-300 bg-gradient-to-br from-background to-muted/30"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Badge
                        variant="secondary"
                        className="text-xs font-medium bg-primary/10 text-primary border-primary/20"
                      >
                        #{strength.rank}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-base mb-2 text-balance">{strength.theme?.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {strength.theme?.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center pt-4">
              <Button
                onClick={handleEditStrengths}
                variant="outline"
                size="lg"
                className="hover:scale-105 transition-transform bg-transparent"
              >
                Update My Strengths
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
