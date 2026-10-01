-- Sanora Migration 005: Outfit history log

create table public.outfit_history (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  outfit_id   uuid references public.outfit_suggestions(id) on delete set null,
  worn_on     date not null default current_date,
  notes       text,
  created_at  timestamptz default now() not null
);

comment on table public.outfit_history is 'Log of outfits the user has worn, with optional notes.';

create index outfit_history_user_id_idx on public.outfit_history (user_id);
create index outfit_history_worn_on_idx on public.outfit_history (user_id, worn_on desc);

-- Row Level Security
alter table public.outfit_history enable row level security;

create policy "outfit_history_select_own"
  on public.outfit_history for select using (auth.uid() = user_id);

create policy "outfit_history_insert_own"
  on public.outfit_history for insert with check (auth.uid() = user_id);

create policy "outfit_history_update_own"
  on public.outfit_history for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "outfit_history_delete_own"
  on public.outfit_history for delete using (auth.uid() = user_id);
