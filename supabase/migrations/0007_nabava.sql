-- Pisi: Nabava — seznam stvari, ki jih je treba še kupiti
-- Zaženi v Supabase Dashboard -> SQL Editor.
--
-- Predpona `pisi_nabava_`, eksplicitni grant za vlogo `authenticated`.
-- Seznam je osebni (RLS user_id = auth.uid()), kot beležke v 0001_init.sql.
-- Nakupi so večinoma enkratni: `bought_at` označi kupljeno.
-- public.set_updated_at() je iz 0001_init.sql — ne redefiniramo je.

-- ============ pisi_nabava_categories (Kategorija) ============

create table public.pisi_nabava_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  position double precision not null default 0,
  created_at timestamptz not null default now(),
  constraint pisi_nabava_categories_name_unique unique (user_id, name)
);

create index pisi_nabava_categories_user_id_idx on public.pisi_nabava_categories(user_id);

alter table public.pisi_nabava_categories enable row level security;

create policy "pisi_nabava_categories_select_own" on public.pisi_nabava_categories
  for select using (user_id = auth.uid());
create policy "pisi_nabava_categories_insert_own" on public.pisi_nabava_categories
  for insert with check (user_id = auth.uid());
create policy "pisi_nabava_categories_update_own" on public.pisi_nabava_categories
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "pisi_nabava_categories_delete_own" on public.pisi_nabava_categories
  for delete using (user_id = auth.uid());

grant select, insert, update, delete on public.pisi_nabava_categories to authenticated;

-- ============ pisi_nabava_items (Izdelek) ============

create table public.pisi_nabava_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- izbrisana kategorija -> izdelek ostane „Brez kategorije“
  category_id uuid references public.pisi_nabava_categories(id) on delete set null,
  name text not null,
  store text not null default '',
  url text not null default '',
  priority text not null default 'normal' check (priority in ('urgent', 'normal')),
  bought_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pisi_nabava_items_user_id_idx on public.pisi_nabava_items(user_id);
create index pisi_nabava_items_category_id_idx on public.pisi_nabava_items(category_id);

create trigger pisi_nabava_items_set_updated_at
  before update on public.pisi_nabava_items
  for each row execute function public.set_updated_at();

alter table public.pisi_nabava_items enable row level security;

create policy "pisi_nabava_items_select_own" on public.pisi_nabava_items
  for select using (user_id = auth.uid());
create policy "pisi_nabava_items_insert_own" on public.pisi_nabava_items
  for insert with check (user_id = auth.uid());
create policy "pisi_nabava_items_update_own" on public.pisi_nabava_items
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "pisi_nabava_items_delete_own" on public.pisi_nabava_items
  for delete using (user_id = auth.uid());

grant select, insert, update, delete on public.pisi_nabava_items to authenticated;
