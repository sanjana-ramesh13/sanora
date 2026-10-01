-- Sanora Migration 004: AI outfit suggestions

create table public.outfit_suggestions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  item_ids        uuid[] not null default '{}',
  ai_description  text,
  occasion        text,
  style_type      text,
  mood            text,   -- bold | minimal | romantic | dreamy | classic | festive
  saved           boolean not null default false,
  created_at      timestamptz default now() not null
);

comment on table public.outfit_suggestions is 'AI-generated outfit combinations, optionally bookmarked by user.';
comment on column public.outfit_suggestions.item_ids is 'UUIDs of clothing_items used in this outfit.';

create index outfit_suggestions_user_id_idx    on public.outfit_suggestions (user_id);
create index outfit_suggestions_saved_idx      on public.outfit_suggestions (user_id, saved) where saved = true;
create index outfit_suggestions_created_at_idx on public.outfit_suggestions (user_id, created_at desc);

-- Row Level Security
alter table public.outfit_suggestions enable row level security;

create policy "outfit_suggestions_select_own"
  on public.outfit_suggestions for select using (auth.uid() = user_id);

create policy "outfit_suggestions_insert_own"
  on public.outfit_suggestions for insert with check (auth.uid() = user_id);

create policy "outfit_suggestions_update_own"
  on public.outfit_suggestions for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "outfit_suggestions_delete_own"
  on public.outfit_suggestions for delete using (auth.uid() = user_id);
