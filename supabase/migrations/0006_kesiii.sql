-- Pisi: Kesiii — kam v hiši sem shranil stvari
-- Zaženi v Supabase Dashboard -> SQL Editor.
--
-- Predpona `pisi_kesiii_`, eksplicitni grant za vlogo `authenticated`.
-- Podatki pripadajo gospodinjstvu (ne posameznemu uporabniku): vsi člani
-- gospodinjstva vidijo in urejajo iste lokacije in predmete. Uporabnik je
-- vedno član natanko enega gospodinjstva (ustvari se ob prvem obisku).
-- Lokacije se poljubno gnezdijo prek `parent_id` (null = soba na vrhu).
-- Tuji ključi na lokacije so privzeti „no action“: lokacije, ki ima
-- podlokacije ali predmete, ne moreš izbrisati, kaskadno brisanje celega
-- gospodinjstva pa deluje (preverja se šele ob koncu stavka).
-- public.set_updated_at() je iz 0001_init.sql — ne redefiniramo je.

-- ============ pisi_kesiii_households (Gospodinjstvo) ============

create table public.pisi_kesiii_households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Moj dom',
  join_code text not null unique
    default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  created_at timestamptz not null default now()
);

-- ============ pisi_kesiii_members (Član gospodinjstva) ============

create table public.pisi_kesiii_members (
  household_id uuid not null references public.pisi_kesiii_households(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  display_name text not null default '',
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create index pisi_kesiii_members_user_id_idx on public.pisi_kesiii_members(user_id);

-- Ali je trenutni uporabnik član gospodinjstva? `security definer`, da RLS
-- politike na members ne kličejo same sebe (rekurzija).
create or replace function public.pisi_kesiii_is_member(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pisi_kesiii_members
    where household_id = hid and user_id = auth.uid()
  );
$$;

-- ============ pisi_kesiii_locations (Lokacija: soba, omara, polica, škatla …) ============

create table public.pisi_kesiii_locations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.pisi_kesiii_households(id) on delete cascade,
  parent_id uuid references public.pisi_kesiii_locations(id),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pisi_kesiii_locations_not_self check (parent_id is null or parent_id <> id)
);

create index pisi_kesiii_locations_household_idx on public.pisi_kesiii_locations(household_id);
create index pisi_kesiii_locations_parent_idx on public.pisi_kesiii_locations(parent_id);

create trigger pisi_kesiii_locations_set_updated_at
  before update on public.pisi_kesiii_locations
  for each row execute function public.set_updated_at();

-- Pot lokacije kot besedilo: „Klet › Regal 2 › Modra škatla“.
create or replace function public.pisi_kesiii_location_path(loc uuid)
returns text
language sql
stable
set search_path = public
as $$
  with recursive up as (
    select id, parent_id, name, 0 as depth
    from public.pisi_kesiii_locations where id = loc
    union all
    select l.id, l.parent_id, l.name, up.depth + 1
    from public.pisi_kesiii_locations l
    join up on l.id = up.parent_id
    where up.depth < 50
  )
  select string_agg(name, ' › ' order by depth desc) from up;
$$;

-- ============ pisi_kesiii_items (Predmet) ============

create table public.pisi_kesiii_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.pisi_kesiii_households(id) on delete cascade,
  name text not null,
  note text not null default '',
  location_id uuid references public.pisi_kesiii_locations(id),
  location_detail text not null default '',
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pisi_kesiii_items_household_idx
  on public.pisi_kesiii_items(household_id, updated_at desc);
create index pisi_kesiii_items_location_idx on public.pisi_kesiii_items(location_id);
create index pisi_kesiii_items_name_trgm_idx
  on public.pisi_kesiii_items using gin (name gin_trgm_ops);
create index pisi_kesiii_items_note_trgm_idx
  on public.pisi_kesiii_items using gin (note gin_trgm_ops);

create trigger pisi_kesiii_items_set_updated_at
  before update on public.pisi_kesiii_items
  for each row execute function public.set_updated_at();

-- ============ pisi_kesiii_item_moves (Zgodovina premikov) ============
-- Poti hranimo kot besedilo (posnetek ob premiku), da zgodovina ostane
-- berljiva tudi, če lokacijo kasneje preimenuješ ali izbrišeš.

create table public.pisi_kesiii_item_moves (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.pisi_kesiii_items(id) on delete cascade,
  household_id uuid not null references public.pisi_kesiii_households(id) on delete cascade,
  from_path text,
  from_detail text not null default '',
  to_path text,
  to_detail text not null default '',
  moved_by uuid default auth.uid() references auth.users(id) on delete set null,
  moved_at timestamptz not null default now()
);

create index pisi_kesiii_item_moves_item_idx
  on public.pisi_kesiii_item_moves(item_id, moved_at desc);

-- Ob spremembi lokacije predmeta samodejno zapiši premik.
create or replace function public.pisi_kesiii_log_move()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.location_id is distinct from old.location_id
     or new.location_detail is distinct from old.location_detail then
    insert into public.pisi_kesiii_item_moves
      (item_id, household_id, from_path, from_detail, to_path, to_detail)
    values (
      new.id, new.household_id,
      public.pisi_kesiii_location_path(old.location_id), old.location_detail,
      public.pisi_kesiii_location_path(new.location_id), new.location_detail
    );
  end if;
  return new;
end;
$$;

create trigger pisi_kesiii_items_log_move
  after update on public.pisi_kesiii_items
  for each row execute function public.pisi_kesiii_log_move();

-- ============ RLS ============

alter table public.pisi_kesiii_households enable row level security;
alter table public.pisi_kesiii_members enable row level security;
alter table public.pisi_kesiii_locations enable row level security;
alter table public.pisi_kesiii_items enable row level security;
alter table public.pisi_kesiii_item_moves enable row level security;

-- Gospodinjstvo: berejo in preimenujejo ga člani. Ustvarjanje / pridružitev
-- gre izključno prek RPC funkcij spodaj.
create policy "pisi_kesiii_households_select" on public.pisi_kesiii_households
  for select using (public.pisi_kesiii_is_member(id));
create policy "pisi_kesiii_households_update" on public.pisi_kesiii_households
  for update using (public.pisi_kesiii_is_member(id))
  with check (public.pisi_kesiii_is_member(id));

-- Člani: vidiš sočlane, urejaš svoje ime.
create policy "pisi_kesiii_members_select" on public.pisi_kesiii_members
  for select using (public.pisi_kesiii_is_member(household_id));
create policy "pisi_kesiii_members_update_own" on public.pisi_kesiii_members
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Lokacije, predmeti, premiki: vse za člane gospodinjstva.
create policy "pisi_kesiii_locations_all" on public.pisi_kesiii_locations
  for all using (public.pisi_kesiii_is_member(household_id))
  with check (public.pisi_kesiii_is_member(household_id));
create policy "pisi_kesiii_items_all" on public.pisi_kesiii_items
  for all using (public.pisi_kesiii_is_member(household_id))
  with check (public.pisi_kesiii_is_member(household_id));
create policy "pisi_kesiii_item_moves_select" on public.pisi_kesiii_item_moves
  for select using (public.pisi_kesiii_is_member(household_id));
create policy "pisi_kesiii_item_moves_insert" on public.pisi_kesiii_item_moves
  for insert with check (public.pisi_kesiii_is_member(household_id));

grant select, update on public.pisi_kesiii_households to authenticated;
grant select, update on public.pisi_kesiii_members to authenticated;
grant select, insert, update, delete on public.pisi_kesiii_locations to authenticated;
grant select, insert, update, delete on public.pisi_kesiii_items to authenticated;
grant select, insert on public.pisi_kesiii_item_moves to authenticated;

-- ============ RPC ============

-- Vrne id gospodinjstva trenutnega uporabnika; če ga še nima, ustvari
-- „Moj dom“ z njim kot lastnikom.
create or replace function public.pisi_kesiii_ensure_household()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
  uname text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select household_id into hid
  from public.pisi_kesiii_members
  where user_id = auth.uid()
  order by joined_at desc
  limit 1;

  if hid is not null then
    return hid;
  end if;

  select split_part(email, '@', 1) into uname from auth.users where id = auth.uid();

  insert into public.pisi_kesiii_households default values returning id into hid;
  insert into public.pisi_kesiii_members (household_id, user_id, display_name, role)
  values (hid, auth.uid(), coalesce(uname, ''), 'owner');
  return hid;
end;
$$;

-- Pridruži se gospodinjstvu s kodo. Uporabnik zapusti dosedanje
-- gospodinjstvo; če v njem ne ostane nihče, se izbriše (z vsemi podatki).
create or replace function public.pisi_kesiii_join(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
  uname text;
  old_hid uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select id into target
  from public.pisi_kesiii_households
  where join_code = upper(trim(code));

  if target is null then
    return null;
  end if;

  if exists (
    select 1 from public.pisi_kesiii_members
    where household_id = target and user_id = auth.uid()
  ) then
    return target;
  end if;

  select display_name into uname
  from public.pisi_kesiii_members
  where user_id = auth.uid()
  order by joined_at desc
  limit 1;

  for old_hid in
    select household_id from public.pisi_kesiii_members where user_id = auth.uid()
  loop
    delete from public.pisi_kesiii_members
    where household_id = old_hid and user_id = auth.uid();
    if not exists (select 1 from public.pisi_kesiii_members where household_id = old_hid) then
      delete from public.pisi_kesiii_items where household_id = old_hid;
      delete from public.pisi_kesiii_households where id = old_hid;
    end if;
  end loop;

  if uname is null then
    select split_part(email, '@', 1) into uname from auth.users where id = auth.uid();
  end if;

  insert into public.pisi_kesiii_members (household_id, user_id, display_name, role)
  values (target, auth.uid(), coalesce(uname, ''), 'member');
  return target;
end;
$$;

-- Zapusti gospodinjstvo (ob naslednjem obisku se ustvari novo, prazno).
create or replace function public.pisi_kesiii_leave()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_hid uuid;
begin
  for old_hid in
    select household_id from public.pisi_kesiii_members where user_id = auth.uid()
  loop
    delete from public.pisi_kesiii_members
    where household_id = old_hid and user_id = auth.uid();
    if not exists (select 1 from public.pisi_kesiii_members where household_id = old_hid) then
      delete from public.pisi_kesiii_items where household_id = old_hid;
      delete from public.pisi_kesiii_households where id = old_hid;
    end if;
  end loop;
end;
$$;

-- Nova koda za povabilo (stara preneha delovati).
create or replace function public.pisi_kesiii_new_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
  c text;
begin
  select household_id into hid
  from public.pisi_kesiii_members
  where user_id = auth.uid()
  order by joined_at desc
  limit 1;
  if hid is null then
    return null;
  end if;
  c := upper(substr(md5(gen_random_uuid()::text), 1, 6));
  update public.pisi_kesiii_households set join_code = c where id = hid;
  return c;
end;
$$;

revoke all on function public.pisi_kesiii_ensure_household() from public;
revoke all on function public.pisi_kesiii_join(text) from public;
revoke all on function public.pisi_kesiii_leave() from public;
revoke all on function public.pisi_kesiii_new_code() from public;
grant execute on function public.pisi_kesiii_ensure_household() to authenticated;
grant execute on function public.pisi_kesiii_join(text) to authenticated;
grant execute on function public.pisi_kesiii_leave() to authenticated;
grant execute on function public.pisi_kesiii_new_code() to authenticated;
grant execute on function public.pisi_kesiii_is_member(uuid) to authenticated;
grant execute on function public.pisi_kesiii_location_path(uuid) to authenticated;
