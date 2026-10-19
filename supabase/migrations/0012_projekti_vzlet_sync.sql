-- Pisi: Projekti ↔ Vzlet — korak projekta se odkljuka, ko ga opraviš v Vzletu
-- Zaženi v Supabase Dashboard -> SQL Editor (po 0011_projekti_vzlet.sql).
--
-- Povezava: `project_step_id` na pisi_vzlet_backlog in pisi_vzlet_tasks.
-- Pisi jo nastavi, ko korak doda v Vzlet (addStepToVzletAction). Vzlet ob
-- premiku s seznama na dan (in nazaj) ustvari novo vrstico z istim imenom in
-- staro izbriše — sprožilca `*_inherit_step` zato povezavo preneseta po imenu.
-- Prenos na drug dan (update for_date) vrstico ohrani, povezava ostane.
--
-- Ko je opravilo v Vzletu odkljukano, `pisi_vzlet_task_sync_step` obkljuka
-- korak in doda zapis v dnevnik dela („Opravljen korak: …“) — enako kot
-- toggleStepAction v src/actions/projekti.ts. Odkljukano nazaj korak odpre in
-- samodejni zapis odstrani. Funkcije tečejo kot klicatelj (RLS velja).

alter table public.pisi_vzlet_backlog
  add column project_step_id uuid references public.pisi_project_steps(id) on delete set null;
alter table public.pisi_vzlet_tasks
  add column project_step_id uuid references public.pisi_project_steps(id) on delete set null;

create index pisi_vzlet_backlog_project_step_id_idx on public.pisi_vzlet_backlog(project_step_id);
create index pisi_vzlet_tasks_project_step_id_idx on public.pisi_vzlet_tasks(project_step_id);

-- ============ Prenos povezave pri premikih v Vzletu ============

-- seznam -> dan: nova naloga podeduje korak od vnosa na seznamu z istim imenom
create or replace function public.pisi_vzlet_task_inherit_step()
returns trigger
language plpgsql
as $$
begin
  if new.project_step_id is null and not new.is_penalty and new.routine_id is null then
    select b.project_step_id into new.project_step_id
    from public.pisi_vzlet_backlog b
    where b.user_id = new.user_id
      and b.title = new.title
      and b.project_step_id is not null
    order by b.created_at desc
    limit 1;
  end if;
  return new;
end;
$$;

create trigger pisi_vzlet_tasks_inherit_step
  before insert on public.pisi_vzlet_tasks
  for each row execute function public.pisi_vzlet_task_inherit_step();

-- dan -> seznam („Vrni na seznam“): vnos podeduje korak od naloge z istim imenom
create or replace function public.pisi_vzlet_backlog_inherit_step()
returns trigger
language plpgsql
as $$
begin
  if new.project_step_id is null then
    select t.project_step_id into new.project_step_id
    from public.pisi_vzlet_tasks t
    where t.user_id = new.user_id
      and t.title = new.title
      and t.project_step_id is not null
      and not t.done
    order by t.created_at desc
    limit 1;
  end if;
  return new;
end;
$$;

create trigger pisi_vzlet_backlog_inherit_step
  before insert on public.pisi_vzlet_backlog
  for each row execute function public.pisi_vzlet_backlog_inherit_step();

-- ============ Odkljukano v Vzletu -> korak v Pisi ============

create or replace function public.pisi_vzlet_task_sync_step()
returns trigger
language plpgsql
as $$
declare
  step public.pisi_project_steps%rowtype;
  entry_body text;
begin
  if new.project_step_id is null or new.done is not distinct from old.done then
    return new;
  end if;

  select * into step from public.pisi_project_steps where id = new.project_step_id;
  if not found then
    return new;
  end if;
  entry_body := 'Opravljen korak: ' || step.title;

  if new.done and step.done_at is null then
    update public.pisi_project_steps
      set done_at = coalesce(new.done_at, now())
      where id = step.id;
    insert into public.pisi_project_entries (project_id, body)
      values (step.project_id, entry_body);
  elsif not new.done and step.done_at is not null then
    update public.pisi_project_steps set done_at = null where id = step.id;
    -- samo zapis, nastal ob tem obkljukanju
    delete from public.pisi_project_entries
      where project_id = step.project_id
        and pisi_project_entries.body = entry_body
        and created_at >= step.done_at;
  end if;

  return new;
end;
$$;

create trigger pisi_vzlet_tasks_sync_step
  after update of done on public.pisi_vzlet_tasks
  for each row execute function public.pisi_vzlet_task_sync_step();

-- ============ Povezava za korake, že dodane v Vzlet (pred to migracijo) ============
-- Pisi jih je poslal z imenom „<korak> (<projekt>)“.

update public.pisi_vzlet_backlog b
set project_step_id = s.id
from public.pisi_project_steps s
join public.pisi_projects p on p.id = s.project_id
where b.project_step_id is null
  and s.vzlet_added_at is not null
  and b.user_id = s.user_id
  and b.title = left(s.title || ' (' || p.title || ')', 500);

update public.pisi_vzlet_tasks t
set project_step_id = s.id
from public.pisi_project_steps s
join public.pisi_projects p on p.id = s.project_id
where t.project_step_id is null
  and s.vzlet_added_at is not null
  and t.user_id = s.user_id
  and t.title = left(s.title || ' (' || p.title || ')', 500);

-- osveži predpomnilnik sheme PostgREST, da API takoj vidi nova stolpca
notify pgrst, 'reload schema';
