-- Create themes table with the 34 CliftonStrengths
CREATE TABLE IF NOT EXISTS public.themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profile table for device-based user identification
CREATE TABLE IF NOT EXISTS public.profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_strengths table to store selected strengths
CREATE TABLE IF NOT EXISTS public.user_strengths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, theme_id),
  UNIQUE(profile_id, rank)
);

-- Enable RLS
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_strengths ENABLE ROW LEVEL SECURITY;

-- RLS policies for single-user demo (allow full access)
CREATE POLICY "themes read all" ON public.themes FOR SELECT USING (true);
CREATE POLICY "profile upsert open" ON public.profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "user_strengths open" ON public.user_strengths FOR ALL USING (true) WITH CHECK (true);

-- Insert the 34 CliftonStrengths themes
INSERT INTO public.themes (name, description) VALUES
  ('Achiever', 'People exceptionally talented in the Achiever theme work hard and possess a great deal of stamina.'),
  ('Activator', 'People exceptionally talented in the Activator theme can make things happen by turning thoughts into action.'),
  ('Adaptability', 'People exceptionally talented in the Adaptability theme prefer to go with the flow; they tend to be "now" people.'),
  ('Analytical', 'People exceptionally talented in the Analytical theme search for reasons and causes.'),
  ('Arranger', 'People exceptionally talented in the Arranger theme can organize, but they also have a flexibility that complements this ability.'),
  ('Belief', 'People exceptionally talented in the Belief theme have certain core values that are unchanging.'),
  ('Command', 'People exceptionally talented in the Command theme have presence and can take control of a situation and make decisions.'),
  ('Communication', 'People exceptionally talented in the Communication theme generally find it easy to put their thoughts into words.'),
  ('Competition', 'People exceptionally talented in the Competition theme measure their progress against the performance of others.'),
  ('Connectedness', 'People exceptionally talented in the Connectedness theme have faith in the links among all things.'),
  ('Consistency', 'People exceptionally talented in the Consistency theme are keenly aware of the need to treat people the same.'),
  ('Context', 'People exceptionally talented in the Context theme enjoy thinking about the past.'),
  ('Deliberative', 'People exceptionally talented in the Deliberative theme are best described by the serious care they take in making decisions.'),
  ('Developer', 'People exceptionally talented in the Developer theme recognize and cultivate the potential in others.'),
  ('Discipline', 'People exceptionally talented in the Discipline theme enjoy routine and structure.'),
  ('Empathy', 'People exceptionally talented in the Empathy theme can sense other peoples emotions by imagining themselves in others lives.'),
  ('Focus', 'People exceptionally talented in the Focus theme can take a direction, follow through, and make the corrections necessary to stay on track.'),
  ('Futuristic', 'People exceptionally talented in the Futuristic theme are inspired by the future and what could be.'),
  ('Harmony', 'People exceptionally talented in the Harmony theme look for consensus and try to fit differing perspectives together.'),
  ('Ideation', 'People exceptionally talented in the Ideation theme are fascinated by ideas.'),
  ('Includer', 'People exceptionally talented in the Includer theme want to include people and make them feel part of the group.'),
  ('Individualization', 'People exceptionally talented in the Individualization theme are intrigued with the unique qualities of each person.'),
  ('Input', 'People exceptionally talented in the Input theme have a need to collect and archive.'),
  ('Intellection', 'People exceptionally talented in the Intellection theme are characterized by their intellectual activity.'),
  ('Learner', 'People exceptionally talented in the Learner theme have a great desire to learn and want to continuously improve.'),
  ('Maximizer', 'People exceptionally talented in the Maximizer theme focus on strengths as a way to stimulate personal and group excellence.'),
  ('Positivity', 'People exceptionally talented in the Positivity theme have contagious enthusiasm.'),
  ('Relator', 'People exceptionally talented in the Relator theme enjoy close relationships with others.'),
  ('Responsibility', 'People exceptionally talented in the Responsibility theme take psychological ownership of what they say they will do.'),
  ('Restorative', 'People exceptionally talented in the Restorative theme are adept at dealing with problems.'),
  ('Self-Assurance', 'People exceptionally talented in the Self-Assurance theme feel confident in their ability to take risks and manage their own lives.'),
  ('Significance', 'People exceptionally talented in the Significance theme want to make a big impact.'),
  ('Strategic', 'People exceptionally talented in the Strategic theme create alternative ways to proceed.'),
  ('Woo', 'People exceptionally talented in the Woo theme love the challenge of meeting new people and winning them over.')
ON CONFLICT (name) DO NOTHING;
