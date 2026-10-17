-- Pisi: Projekti — odprti projekti z dnevnikom dela, koraki, slikami in nabavo
-- Zaženi v Supabase Dashboard -> SQL Editor (po 0008_nabava_urls.sql).
--
-- Predpona `pisi_project`, eksplicitni grant za vlogo `authenticated`.
-- Projekti so osebni (RLS user_id = auth.uid()), kot Nabava v 0007_nabava.sql.
-- `completed_at` označi dokončan projekt (null = odprt).
-- Nabava projekta so navadni izdelki v pisi_nabava_items s `project_id`.
-- Slike so v obstoječem bucketu `pisi-images` (<user_id>/projekti/...).
-- public.set_updated_at() je iz 0001_init.sql — ne redefiniramo je.

-- ============ pisi_projects (Projekt) ============

create table public.pisi_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  notes text not null default '',
  links text[] not null default '{}',
  completed_at timestamptz,
  position double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pisi_projects_user_id_idx on public.pisi_projects(user_id);

create trigger pisi_projects_set_updated_at
  before update on public.pisi_projects
  for each row execute function public.set_updated_at();

alter table public.pisi_projects enable row level security;

create policy "pisi_projects_select_own" on public.pisi_projects
  for select using (user_id = auth.uid());
create policy "pisi_projects_insert_own" on public.pisi_projects
  for insert with check (user_id = auth.uid());
create policy "pisi_projects_update_own" on public.pisi_projects
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "pisi_projects_delete_own" on public.pisi_projects
  for delete using (user_id = auth.uid());

grant select, insert, update, delete on public.pisi_projects to authenticated;

-- ============ pisi_project_entries (Dnevnik dela) ============

create table public.pisi_project_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references public.pisi_projects(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pisi_project_entries_project_id_idx on public.pisi_project_entries(project_id);

create trigger pisi_project_entries_set_updated_at
  before update on public.pisi_project_entries
  for each row execute function public.set_updated_at();

alter table public.pisi_project_entries enable row level security;

create policy "pisi_project_entries_select_own" on public.pisi_project_entries
  for select using (user_id = auth.uid());
create policy "pisi_project_entries_insert_own" on public.pisi_project_entries
  for insert with check (user_id = auth.uid());
create policy "pisi_project_entries_update_own" on public.pisi_project_entries
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "pisi_project_entries_delete_own" on public.pisi_project_entries
  for delete using (user_id = auth.uid());

grant select, insert, update, delete on public.pisi_project_entries to authenticated;

-- ============ pisi_project_steps (Koraki) ============

create table public.pisi_project_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references public.pisi_projects(id) on delete cascade,
  title text not null,
  done_at timestamptz,
  position double precision not null default 0,
  created_at timestamptz not null default now()
);

create index pisi_project_steps_project_id_idx on public.pisi_project_steps(project_id);

alter table public.pisi_project_steps enable row level security;

create policy "pisi_project_steps_select_own" on public.pisi_project_steps
  for select using (user_id = auth.uid());
create policy "pisi_project_steps_insert_own" on public.pisi_project_steps
  for insert with check (user_id = auth.uid());
create policy "pisi_project_steps_update_own" on public.pisi_project_steps
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "pisi_project_steps_delete_own" on public.pisi_project_steps
  for delete using (user_id = auth.uid());

grant select, insert, update, delete on public.pisi_project_steps to authenticated;

-- ============ pisi_project_images (Slike) ============

create table public.pisi_project_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references public.pisi_projects(id) on delete cascade,
  -- pot v bucketu pisi-images
  path text not null,
  created_at timestamptz not null default now()
);

create index pisi_project_images_project_id_idx on public.pisi_project_images(project_id);

alter table public.pisi_project_images enable row level security;

create policy "pisi_project_images_select_own" on public.pisi_project_images
  for select using (user_id = auth.uid());
create policy "pisi_project_images_insert_own" on public.pisi_project_images
  for insert with check (user_id = auth.uid());
create policy "pisi_project_images_delete_own" on public.pisi_project_images
  for delete using (user_id = auth.uid());

grant select, insert, delete on public.pisi_project_images to authenticated;

-- ============ Nabava: izdelki projekta + cena ============

alter table public.pisi_nabava_items
  add column project_id uuid references public.pisi_projects(id) on delete cascade,
  add column price numeric(10, 2);

create index pisi_nabava_items_project_id_idx on public.pisi_nabava_items(project_id);
