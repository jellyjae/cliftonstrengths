-- Create daily_prompts table for storing daily prompt selections
create table if not exists public.daily_prompts (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  for_date date not null,
  aspect wellbeing_aspect not null,
  theme_id uuid not null references public.themes(id),
  prompt_id uuid not null references public.prompts(id),
  created_at timestamptz default now(),
  unique(device_id, for_date, aspect)
);

-- Enable RLS and create policies
alter table public.daily_prompts enable row level security;

create policy "daily_prompts open" on public.daily_prompts 
  for all using (true) with check (true);
