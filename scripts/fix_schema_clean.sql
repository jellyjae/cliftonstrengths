DROP TABLE IF EXISTS public.user_strengths CASCADE;
DROP TABLE IF EXISTS public.daily_prompts CASCADE;
DROP TABLE IF EXISTS public.profile CASCADE;

CREATE TABLE public.profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_strengths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, theme_id),
  UNIQUE(profile_id, rank)
);

CREATE TABLE public.daily_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  for_date DATE NOT NULL,
  aspect wellbeing_aspect NOT NULL,
  theme_id UUID NOT NULL REFERENCES public.themes(id),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(device_id, for_date, aspect)
);

ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_strengths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile upsert open" ON public.profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "user_strengths open" ON public.user_strengths FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "daily_prompts open" ON public.daily_prompts FOR ALL USING (true) WITH CHECK (true);

