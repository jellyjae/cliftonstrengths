"use server"

export async function getThemes() {
  try {
    console.log("[v0] Returning fallback themes (database connection skipped)")
    return {
      data: getFallbackThemes(),
      error: null,
    }
  } catch (error) {
    console.error("[v0] Server error fetching themes:", error)
    return {
      data: getFallbackThemes(),
      error: null,
    }
  }
}

function getFallbackThemes() {
  return [
    {
      id: 1,
      name: "Achiever",
      description: "People exceptionally talented in the Achiever theme work hard and possess a great deal of stamina.",
    },
    {
      id: 2,
      name: "Activator",
      description:
        "People exceptionally talented in the Activator theme can make things happen by turning thoughts into action.",
    },
    {
      id: 3,
      name: "Adaptability",
      description: "People exceptionally talented in the Adaptability theme prefer to go with the flow.",
    },
    {
      id: 4,
      name: "Analytical",
      description: "People exceptionally talented in the Analytical theme search for reasons and causes.",
    },
    {
      id: 5,
      name: "Arranger",
      description:
        "People exceptionally talented in the Arranger theme can organize, but they also have a flexibility that complements this ability.",
    },
    {
      id: 6,
      name: "Belief",
      description: "People exceptionally talented in the Belief theme have certain core values that are unchanging.",
    },
    {
      id: 7,
      name: "Command",
      description:
        "People exceptionally talented in the Command theme have presence. They can take control of a situation and make decisions.",
    },
    {
      id: 8,
      name: "Communication",
      description:
        "People exceptionally talented in the Communication theme generally find it easy to put their thoughts into words.",
    },
    {
      id: 9,
      name: "Competition",
      description:
        "People exceptionally talented in the Competition theme measure their progress against the performance of others.",
    },
    {
      id: 10,
      name: "Connectedness",
      description: "People exceptionally talented in the Connectedness theme have faith in the links among all things.",
    },
    {
      id: 11,
      name: "Consistency",
      description:
        "People exceptionally talented in the Consistency theme are keenly aware of the need to treat people the same.",
    },
    {
      id: 12,
      name: "Context",
      description: "People exceptionally talented in the Context theme enjoy thinking about the past.",
    },
    {
      id: 13,
      name: "Deliberative",
      description:
        "People exceptionally talented in the Deliberative theme are best described by the serious care they take in making decisions.",
    },
    {
      id: 14,
      name: "Developer",
      description:
        "People exceptionally talented in the Developer theme recognize and cultivate the potential in others.",
    },
    {
      id: 15,
      name: "Discipline",
      description: "People exceptionally talented in the Discipline theme enjoy routine and structure.",
    },
    {
      id: 16,
      name: "Empathy",
      description:
        "People exceptionally talented in the Empathy theme can sense other people's emotions by imagining themselves in others' lives.",
    },
    {
      id: 17,
      name: "Focus",
      description:
        "People exceptionally talented in the Focus theme can take a direction, follow through and make the corrections necessary to stay on track.",
    },
    {
      id: 18,
      name: "Futuristic",
      description:
        "People exceptionally talented in the Futuristic theme are inspired by the future and what could be.",
    },
    { id: 19, name: "Harmony", description: "People exceptionally talented in the Harmony theme look for consensus." },
    {
      id: 20,
      name: "Ideation",
      description: "People exceptionally talented in the Ideation theme are fascinated by ideas.",
    },
    { id: 21, name: "Includer", description: "People exceptionally talented in the Includer theme accept others." },
    {
      id: 22,
      name: "Individualization",
      description:
        "People exceptionally talented in the Individualization theme are intrigued with the unique qualities of each person.",
    },
    {
      id: 23,
      name: "Input",
      description: "People exceptionally talented in the Input theme have a craving to know more.",
    },
    {
      id: 24,
      name: "Intellection",
      description:
        "People exceptionally talented in the Intellection theme are characterized by their intellectual activity.",
    },
    {
      id: 25,
      name: "Learner",
      description:
        "People exceptionally talented in the Learner theme have a great desire to learn and want to continuously improve.",
    },
    {
      id: 26,
      name: "Maximizer",
      description:
        "People exceptionally talented in the Maximizer theme focus on strengths as a way to stimulate personal and group excellence.",
    },
    {
      id: 27,
      name: "Positivity",
      description: "People exceptionally talented in the Positivity theme have contagious enthusiasm.",
    },
    {
      id: 28,
      name: "Relator",
      description: "People exceptionally talented in the Relator theme enjoy close relationships with others.",
    },
    {
      id: 29,
      name: "Responsibility",
      description:
        "People exceptionally talented in the Responsibility theme take psychological ownership of what they say they will do.",
    },
    {
      id: 30,
      name: "Restorative",
      description: "People exceptionally talented in the Restorative theme are adept at dealing with problems.",
    },
    {
      id: 31,
      name: "Self-Assurance",
      description:
        "People exceptionally talented in the Self-Assurance theme feel confident in their ability to manage their own lives.",
    },
    {
      id: 32,
      name: "Significance",
      description: "People exceptionally talented in the Significance theme want to be very important in others' eyes.",
    },
    {
      id: 33,
      name: "Strategic",
      description: "People exceptionally talented in the Strategic theme create alternative ways to proceed.",
    },
    {
      id: 34,
      name: "Woo",
      description:
        "People exceptionally talented in the Woo theme love the challenge of meeting new people and winning them over.",
    },
  ]
}
