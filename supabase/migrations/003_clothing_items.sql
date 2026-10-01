-- Sanora Migration 003: Clothing items table

create table public.clothing_items (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null check (char_length(name) >= 1 and char_length(name) <= 100),
  category        text not null check (category in (
                    'top', 'bottom', 'dupatta', 'footwear', 'accessory', 'outerwear', 'full-outfit'
                  )),
  style_type      text[] not null default '{}',
  primary_color   text,
  secondary_color text,
  season          text[] not null default '{"all"}',
  occasion        text[] not null default '{}',
  image_url       text,
  tags            text[] not null default '{}',
  created_at      timestamptz default now() not null
);

comment on table public.clothing_items is 'Individual clothing items in a user''s digital wardrobe.';
comment on column public.clothing_items.style_type is 'Array: traditional, western, indo-western';
comment on column public.clothing_items.season     is 'Array: summer, winter, monsoon, all';
comment on column public.clothing_items.occasion   is 'Array: casual, formal, festive, party, work';

-- Indexes for common query patterns
create index clothing_items_user_id_idx      on public.clothing_items (user_id);
create index clothing_items_user_cat_idx     on public.clothing_items (user_id, category);
create index clothing_items_style_type_idx   on public.clothing_items using gin (style_type);
create index clothing_items_occasion_idx     on public.clothing_items using gin (occasion);
create index clothing_items_tags_idx         on public.clothing_items using gin (tags);

-- Row Level Security
alter table public.clothing_items enable row level security;

create policy "clothing_items_select_own"
  on public.clothing_items for select
  using (auth.uid() = user_id);

create policy "clothing_items_insert_own"
  on public.clothing_items for insert
  with check (auth.uid() = user_id);

create policy "clothing_items_update_own"
  on public.clothing_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "clothing_items_delete_own"
  on public.clothing_items for delete
  using (auth.uid() = user_id);
