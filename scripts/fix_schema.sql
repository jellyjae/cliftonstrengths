-- Fix the device_id column type mismatch
-- The app expects device_id to be text, but the current schema has it as UUID

-- First, drop the existing tables that depend on profile
DROP TABLE IF EXISTS public.user_strengths CASCADE;
DROP TABLE IF EXISTS public.daily_prompts CASCADE;

-- Drop the profile table
DROP TABLE IF EXISTS public.profile CASCADE;

-- Recreate profile table with correct device_id type
CREATE TABLE public.profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate user_strengths table with correct structure
CREATE TABLE public.user_strengths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, theme_id),
  UNIQUE(profile_id, rank)
);

-- Recreate daily_prompts table
CREATE TABLE public.daily_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  for_date DATE NOT NULL,
  aspect wellbeing_aspect NOT NULL,
  theme_id UUID NOT NULL REFERENCES public.themes(id),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(device_id, for_date, aspect)
);

-- Enable RLS
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_strengths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_prompts ENABLE ROW LEVEL SECURITY;

-- RLS policies for single-user demo (allow full access)
CREATE POLICY "profile upsert open" ON public.profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "user_strengths open" ON public.user_strengths FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "daily_prompts open" ON public.daily_prompts FOR ALL USING (true) WITH CHECK (true);

