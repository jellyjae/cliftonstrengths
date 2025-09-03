"use server"

import { createClient } from "@/lib/supabase/server"

export async function getThemes() {
  try {
    console.log("[v0] Fetching themes from database...")
    
    const supabase = await createClient()
    
    const { data: themes, error } = await supabase
      .from("themes")
      .select("id, name, description")
      .order("name")
    
    if (error) {
      console.error("[v0] Error fetching themes from database:", error)
      console.log("[v0] Falling back to hardcoded themes")
      return {
        data: getFallbackThemes(),
        error: null,
      }
    }
    
    if (!themes || themes.length === 0) {
      console.log("[v0] No themes found in database, using fallbacks")
      return {
        data: getFallbackThemes(),
        error: null,
      }
    }
    
    console.log("[v0] Successfully fetched", themes.length, "themes from database")
    return {
      data: themes,
      error: null,
    }
  } catch (error) {
    console.error("[v0] Server error fetching themes:", error)
    console.log("[v0] Falling back to hardcoded themes")
    return {
      data: getFallbackThemes(),
      error: null,
    }
  }
}

function getFallbackThemes() {
  return [
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      name: "Achiever",
      description: "People exceptionally talented in the Achiever theme work hard and possess a great deal of stamina.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440002",
      name: "Activator",
      description:
        "People exceptionally talented in the Activator theme can make things happen by turning thoughts into action.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440003",
      name: "Adaptability",
      description: "People exceptionally talented in the Adaptability theme prefer to go with the flow.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440004",
      name: "Analytical",
      description: "People exceptionally talented in the Analytical theme search for reasons and causes.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440005",
      name: "Arranger",
      description:
        "People exceptionally talented in the Arranger theme can organize, but they also have a flexibility that complements this ability.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440006",
      name: "Belief",
      description: "People exceptionally talented in the Belief theme have certain core values that are unchanging.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440007",
      name: "Command",
      description:
        "People exceptionally talented in the Command theme have presence. They can take control of a situation and make decisions.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440008",
      name: "Communication",
      description:
        "People exceptionally talented in the Communication theme generally find it easy to put their thoughts into words.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440009",
      name: "Competition",
      description:
        "People exceptionally talented in the Competition theme measure their progress against the performance of others.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440010",
      name: "Connectedness",
      description: "People exceptionally talented in the Connectedness theme have faith in the links among all things.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440011",
      name: "Consistency",
      description:
        "People exceptionally talented in the Consistency theme are keenly aware of the need to treat people the same.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440012",
      name: "Context",
      description: "People exceptionally talented in the Context theme enjoy thinking about the past.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440013",
      name: "Deliberative",
      description:
        "People exceptionally talented in the Deliberative theme are best described by the serious care they take in making decisions.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440014",
      name: "Developer",
      description:
        "People exceptionally talented in the Developer theme recognize and cultivate the potential in others.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440015",
      name: "Discipline",
      description: "People exceptionally talented in the Discipline theme enjoy routine and structure.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440016",
      name: "Empathy",
      description:
        "People exceptionally talented in the Empathy theme can sense other people's emotions by imagining themselves in others' lives.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440017",
      name: "Focus",
      description:
        "People exceptionally talented in the Focus theme can take a direction, follow through and make the corrections necessary to stay on track.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440018",
      name: "Futuristic",
      description:
        "People exceptionally talented in the Futuristic theme are inspired by the future and what could be.",
    },
    { id: "550e8400-e29b-41d4-a716-446655440019", name: "Harmony", description: "People exceptionally talented in the Harmony theme look for consensus." },
    {
      id: "550e8400-e29b-41d4-a716-446655440020",
      name: "Ideation",
      description: "People exceptionally talented in the Ideation theme are fascinated by ideas.",
    },
    { id: "550e8400-e29b-41d4-a716-446655440021", name: "Includer", description: "People exceptionally talented in the Includer theme accept others." },
    {
      id: "550e8400-e29b-41d4-a716-446655440022",
      name: "Individualization",
      description:
        "People exceptionally talented in the Individualization theme are intrigued with the unique qualities of each person.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440023",
      name: "Input",
      description: "People exceptionally talented in the Input theme have a craving to know more.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440024",
      name: "Intellection",
      description:
        "People exceptionally talented in the Intellection theme are characterized by their intellectual activity.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440025",
      name: "Learner",
      description:
        "People exceptionally talented in the Learner theme have a great desire to learn and want to continuously improve.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440026",
      name: "Maximizer",
      description:
        "People exceptionally talented in the Maximizer theme focus on strengths as a way to stimulate personal and group excellence.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440027",
      name: "Positivity",
      description: "People exceptionally talented in the Positivity theme have contagious enthusiasm.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440028",
      name: "Relator",
      description: "People exceptionally talented in the Relator theme enjoy close relationships with others.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440029",
      name: "Responsibility",
      description:
        "People exceptionally talented in the Responsibility theme take psychological ownership of what they say they will do.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440030",
      name: "Restorative",
      description: "People exceptionally talented in the Restorative theme are adept at dealing with problems.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440031",
      name: "Self-Assurance",
      description:
        "People exceptionally talented in the Self-Assurance theme feel confident in their ability to manage their own lives.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440032",
      name: "Significance",
      description: "People exceptionally talented in the Significance theme want to be very important in others' eyes.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440033",
      name: "Strategic",
      description: "People exceptionally talented in the Strategic theme create alternative ways to proceed.",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440034",
      name: "Woo",
      description:
        "People exceptionally talented in the Woo theme love the challenge of meeting new people and winning them over.",
    },
  ]
}
