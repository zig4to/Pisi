-- Pisi: Nabava — več linkov na izdelek
-- Zaženi v Supabase Dashboard -> SQL Editor (po 0007_nabava.sql).
--
-- Stolpec `url` (en link) zamenja `urls` (seznam linkov); obstoječi linki se prenesejo.

alter table public.pisi_nabava_items
  add column urls text[] not null default '{}';

update public.pisi_nabava_items
  set urls = array[url]
  where url <> '';

alter table public.pisi_nabava_items drop column url;
