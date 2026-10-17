-- Pisi: Projekti — stalna barva projekta (da se barve projektov ne ponavljajo)
-- Zaženi v Supabase Dashboard -> SQL Editor (po 0009_projekti.sql).
--
-- Nov projekt dobi barvo, ki je noben drug projekt uporabnika še nima
-- (glej createProjectAction). Obstoječim projektom jo dodelimo tu: prvih 10
-- po vrsti iz palete (src/lib/utils/color.ts), nadaljnjim odtenek z zlatim kotom.

alter table public.pisi_projects add column color text;

with numbered as (
  select id, row_number() over (partition by user_id order by created_at) as n
  from public.pisi_projects
)
update public.pisi_projects p
set color = case
  when n.n <= 10 then (array[
    '#3B82F6', '#F97316', '#10B981', '#EF4444', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F59E0B', '#6366F1', '#84CC16'
  ])[n.n]
  else 'hsl(' || round(((n.n - 11) * 137.508 + 20)::numeric % 360) || ' 65% 50%)'
end
from numbered n
where n.id = p.id;

-- osveži predpomnilnik sheme PostgREST, da API takoj vidi nov stolpec
notify pgrst, 'reload schema';
