import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SearchResult } from "@/lib/types/database.types";

type TypedSupabaseClient = SupabaseClient<Database>;

function makeSnippet(text: string, query: string): string {
  if (!text) return "";
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, 160).trim();
  const start = Math.max(0, idx - 60);
  const end = Math.min(text.length, idx + query.length + 100);
  return (start > 0 ? "… " : "") + text.slice(start, end).trim() + (end < text.length ? " …" : "");
}

/**
 * Iskanje po naslovih in vsebini vseh aktivnih strani uporabnika.
 * Uporablja `ilike` (podprto z GIN trgram indeksoma iz migracije).
 */
export async function searchPages(
  supabase: TypedSupabaseClient,
  rawQuery: string
): Promise<SearchResult[]> {
  const query = rawQuery.trim();
  if (query.length < 2) return [];

  // Za PostgREST `or` filter: odstrani znake, ki bi razbili razčlenjevanje
  // (vejice, oklepaje, narekovaje), in ubeži `%`/`_` v LIKE vzorcu.
  const sanitized = query.replace(/["(),]/g, " ").trim();
  if (sanitized.length < 2) return [];
  const escaped = sanitized.replace(/[%_\\]/g, (m) => `\\${m}`);
  const pattern = `%${escaped}%`;

  const { data, error } = await supabase
    .from("pisi_pages")
    .select(
      "id, title, content_text, updated_at, deleted_at, pisi_sections!inner(id, title, deleted_at, pisi_notebooks!inner(id, title, deleted_at))"
    )
    .is("deleted_at", null)
    .or(`title.ilike."${pattern}",content_text.ilike."${pattern}"`)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  type Row = {
    id: string;
    title: string;
    content_text: string;
    updated_at: string;
    deleted_at: string | null;
    pisi_sections: {
      id: string;
      title: string;
      deleted_at: string | null;
      pisi_notebooks: { id: string; title: string; deleted_at: string | null };
    };
  };

  return ((data ?? []) as unknown as Row[])
    .filter(
      (r) =>
        r.pisi_sections.deleted_at === null &&
        r.pisi_sections.pisi_notebooks.deleted_at === null
    )
    .map((r) => ({
      page_id: r.id,
      title: r.title,
      snippet: makeSnippet(r.content_text, query),
      section_id: r.pisi_sections.id,
      section_title: r.pisi_sections.title,
      notebook_id: r.pisi_sections.pisi_notebooks.id,
      notebook_title: r.pisi_sections.pisi_notebooks.title,
      updated_at: r.updated_at,
    }));
}
