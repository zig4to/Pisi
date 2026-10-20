-- Pisi: Nabava ↔ Vzlet — izdelek se odkljuka, ko opravilo „Kupi: …“ opraviš v Vzletu
-- Zaženi v Supabase Dashboard -> SQL Editor (po 0012_projekti_vzlet_sync.sql).
--
-- Enako kot pri korakih projekta (0012): `nabava_item_id` na pisi_vzlet_backlog
-- in pisi_vzlet_tasks. Pisi jo nastavi v addItemToVzletAction. Ker Vzlet ob
-- premiku med seznamom in dnevom vrstico ustvari na novo, sprožilca
-- `*_inherit_nabava` povezavo preneseta po imenu.
--
-- Ko je opravilo v Vzletu odkljukano, `pisi_vzlet_task_sync_nabava` izdelek
-- označi kot kupljen (bought_at) — enako kot setBoughtAction v
-- src/actions/nabava.ts. Odkljukano nazaj ga vrne na seznam. Funkcije tečejo
-- kot klicatelj (RLS velja).

alter table public.pisi_vzlet_backlog
  add column nabava_item_id uuid references public.pisi_nabava_items(id) on delete set null;
alter table public.pisi_vzlet_tasks
  add column nabava_item_id uuid references public.pisi_nabava_items(id) on delete set null;

create index pisi_vzlet_backlog_nabava_item_id_idx on public.pisi_vzlet_backlog(nabava_item_id);
create index pisi_vzlet_tasks_nabava_item_id_idx on public.pisi_vzlet_tasks(nabava_item_id);

-- ============ Prenos povezave pri premikih v Vzletu ============

-- seznam -> dan: nova naloga podeduje izdelek od vnosa na seznamu z istim imenom
create or replace function public.pisi_vzlet_task_inherit_nabava()
returns trigger
language plpgsql
as $$
begin
  if new.nabava_item_id is null and not new.is_penalty and new.routine_id is null then
    select b.nabava_item_id into new.nabava_item_id
    from public.pisi_vzlet_backlog b
    where b.user_id = new.user_id
      and b.title = new.title
      and b.nabava_item_id is not null
    order by b.created_at desc
    limit 1;
  end if;
  return new;
end;
$$;

create trigger pisi_vzlet_tasks_inherit_nabava
  before insert on public.pisi_vzlet_tasks
  for each row execute function public.pisi_vzlet_task_inherit_nabava();

-- dan -> seznam („Vrni na seznam“): vnos podeduje izdelek od naloge z istim imenom
create or replace function public.pisi_vzlet_backlog_inherit_nabava()
returns trigger
language plpgsql
as $$
begin
  if new.nabava_item_id is null then
    select t.nabava_item_id into new.nabava_item_id
    from public.pisi_vzlet_tasks t
    where t.user_id = new.user_id
      and t.title = new.title
      and t.nabava_item_id is not null
      and not t.done
    order by t.created_at desc
    limit 1;
  end if;
  return new;
end;
$$;

create trigger pisi_vzlet_backlog_inherit_nabava
  before insert on public.pisi_vzlet_backlog
  for each row execute function public.pisi_vzlet_backlog_inherit_nabava();

-- ============ Odkljukano v Vzletu -> kupljeno v Nabavi ============

create or replace function public.pisi_vzlet_task_sync_nabava()
returns trigger
language plpgsql
as $$
begin
  if new.nabava_item_id is null or new.done is not distinct from old.done then
    return new;
  end if;

  if new.done then
    update public.pisi_nabava_items
      set bought_at = coalesce(new.done_at, now())
      where id = new.nabava_item_id and bought_at is null;
  else
    update public.pisi_nabava_items
      set bought_at = null
      where id = new.nabava_item_id and bought_at is not null;
  end if;

  return new;
end;
$$;

create trigger pisi_vzlet_tasks_sync_nabava
  after update of done on public.pisi_vzlet_tasks
  for each row execute function public.pisi_vzlet_task_sync_nabava();

-- ============ Povezava za izdelke, že dodane v Vzlet (pred to migracijo) ============
-- Pisi jih je poslal z imenom „Kupi: <izdelek>“.

update public.pisi_vzlet_backlog b
set nabava_item_id = i.id
from public.pisi_nabava_items i
where b.nabava_item_id is null
  and i.bought_at is null
  and b.user_id = i.user_id
  and b.title = left('Kupi: ' || i.name, 500);

update public.pisi_vzlet_tasks t
set nabava_item_id = i.id
from public.pisi_nabava_items i
where t.nabava_item_id is null
  and i.bought_at is null
  and not t.done
  and t.user_id = i.user_id
  and t.title = left('Kupi: ' || i.name, 500);

-- osveži predpomnilnik sheme PostgREST, da API takoj vidi nova stolpca
notify pgrst, 'reload schema';
