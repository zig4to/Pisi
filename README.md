# Pisi

Aplikacija za beleženje v slogu OneNote: **Beležka → Sekcija → Stran**, z WYSIWYG
urejevalnikom, prijavo (Supabase Auth), iskanjem, značkami, pripenjanjem, ročnim
razvrščanjem (drag & drop), košem in izvozom v Markdown.

Stack: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 ·
`@supabase/ssr` · Tiptap.

## Namestitev

```bash
npm install
```

## Okoljske spremenljivke

`.env.local` že vsebuje povezavo na skupni Supabase projekt (isti kot `Posel`).
Če želiš svoj projekt, prilagodi:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Baza (Supabase)

1. Odpri **Supabase Dashboard → SQL Editor**.
2. Zaženi celotno vsebino `supabase/migrations/0001_init.sql`.
   - Ustvari tabele `pisi_notebooks`, `pisi_sections`, `pisi_pages`, `pisi_tags`,
     `pisi_page_tags` (predpona `pisi_`, ker je projekt skupen z `Posel`).
   - Vklopi RLS (`user_id = auth.uid()`) in podeli pravice vlogi `authenticated`.
   - Ustvari javni Storage bucket `pisi-images` in pravila, da vsak uporabnik
     piše samo v svojo mapo (`pisi-images/<user_id>/...`).
3. Če želiš samodejno prijavo takoj po registraciji, v **Authentication →
   Providers → Email** izklopi "Confirm email" (sicer je treba potrditi e-pošto).

## Zagon

```bash
npm run dev      # http://localhost:3000
npm run lint
npm run build
```

## Uporaba

- `/registracija` – ustvari račun · `/login` – prijava.
- V stranski vrstici: **Nova beležka**, znotraj beležke **+** za sekcijo,
  v sekciji **Nova stran**.
- Stran se shranjuje samodejno (~0,8 s po zadnji spremembi).
- Vlečenje beležk / sekcij / strani spremeni vrstni red.
- Meni (⋮) ponuja preimenovanje, pripenjanje, izvoz v Markdown in premik v koš.
- `/iskanje`, `/znacke`, `/kos`, `/nastavitve` so v spodnjem delu stranske vrstice.
