export interface Theme {
  id: string
  name: string
  description: string
}

export interface Profile {
  id: string
  device_id: string
  created_at: string
  updated_at: string
}

export interface UserStrength {
  id: string
  profile_id: string
  theme_id: string
  rank: number
  theme?: Theme
}

export interface Prompt {
  id: string
  theme_id: string
  aspect: "career" | "social" | "financial" | "physical" | "community"
  prompt_text: string
  tags?: string[]
  theme?: Theme
}

export interface DailyPrompt {
  id: string
  device_id: string
  for_date: string
  aspect: "career" | "social" | "financial" | "physical" | "community"
  theme_id: string
  prompt_id: string
  created_at: string
  prompt?: Prompt
  theme?: Theme
}
