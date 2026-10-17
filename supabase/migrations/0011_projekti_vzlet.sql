-- Pisi: Projekti — korak dodan na splošni seznam opravil v aplikaciji Vzlet
-- Zaženi v Supabase Dashboard -> SQL Editor (po 0010_projekti_color.sql).
--
-- Vzlet si deli isti Supabase projekt (tabela pisi_vzlet_backlog, migracija
-- 0010_vzlet_backlog.sql v repozitoriju Vzlet). `vzlet_added_at` le označi,
-- da je bil korak poslan v Vzlet (oznaka v seznamu korakov).

alter table public.pisi_project_steps add column vzlet_added_at timestamptz;

-- osveži predpomnilnik sheme PostgREST, da API takoj vidi nov stolpec
notify pgrst, 'reload schema';
