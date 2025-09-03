-- Create wellbeing aspect enum
create type wellbeing_aspect as enum ('career','social','financial','physical','community');

-- Create prompts table
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid not null references public.themes(id) on delete cascade,
  aspect wellbeing_aspect not null,
  prompt_text text not null,
  tags text[],
  created_at timestamp with time zone default now(),
  unique(theme_id, aspect, prompt_text)
);

-- Enable RLS
alter table public.prompts enable row level security;

-- RLS policies for single-user demo
create policy "prompts read all" on public.prompts for select using (true);
create policy "prompts insert open (dev)" on public.prompts for insert with check (true);
create policy "prompts update open (dev)" on public.prompts for update using (true);
create policy "prompts delete open (dev)" on public.prompts for delete using (true);
