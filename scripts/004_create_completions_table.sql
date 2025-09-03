-- Create completions table for tracking prompt completions
create table if not exists public.completions (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  for_date date not null,
  prompt_id uuid not null references public.prompts(id),
  aspect wellbeing_aspect not null,
  completed_at timestamptz default now(),
  unique(device_id, for_date, prompt_id)
);

-- Enable RLS
alter table public.completions enable row level security;

-- Create policy for single-user demo (allow full access)
create policy "completions open" on public.completions 
  for all using (true) with check (true);

-- Create index for better query performance
create index if not exists idx_completions_device_date on public.completions(device_id, for_date);
create index if not exists idx_completions_prompt on public.completions(prompt_id);
