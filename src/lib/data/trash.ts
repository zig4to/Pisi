import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TrashItem } from "@/lib/types/database.types";

type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Vsi izbrisani (mehko) elementi uporabnika, urejeni po času brisanja padajoče.
 * Sekcije/strani, katerih starš je prav tako v košu, prav tako prikažemo — ob
 * obnovitvi starša se vrnejo skupaj, obnova posameznega otroka pa je še vedno
 * mogoča, če je starš aktiven.
 */
export async function getTrashedItems(
  supabase: TypedSupabaseClient
): Promise<TrashItem[]> {
  const [notebooksRes, sectionsRes, pagesRes] = await Promise.all([
    supabase
      .from("pisi_notebooks")
      .select("id, title, deleted_at")
      .not("deleted_at", "is", null),
    supabase
      .from("pisi_sections")
      .select("id, title, deleted_at, pisi_notebooks(title)")
      .not("deleted_at", "is", null),
    supabase
      .from("pisi_pages")
      .select(
        "id, title, deleted_at, pisi_sections(title, pisi_notebooks(title))"
      )
      .not("deleted_at", "is", null),
  ]);

  if (notebooksRes.error) throw notebooksRes.error;
  if (sectionsRes.error) throw sectionsRes.error;
  if (pagesRes.error) throw pagesRes.error;

  const items: TrashItem[] = [];

  for (const nb of notebooksRes.data ?? []) {
    items.push({
      kind: "notebook",
      id: nb.id,
      title: nb.title,
      deleted_at: nb.deleted_at as string,
      context: null,
    });
  }

  for (const s of (sectionsRes.data ?? []) as unknown as {
    id: string;
    title: string;
    deleted_at: string;
    pisi_notebooks: { title: string } | null;
  }[]) {
    items.push({
      kind: "section",
      id: s.id,
      title: s.title,
      deleted_at: s.deleted_at,
      context: s.pisi_notebooks?.title ?? null,
    });
  }

  for (const p of (pagesRes.data ?? []) as unknown as {
    id: string;
    title: string;
    deleted_at: string;
    pisi_sections: {
      title: string;
      pisi_notebooks: { title: string } | null;
    } | null;
  }[]) {
    const nb = p.pisi_sections?.pisi_notebooks?.title;
    const sec = p.pisi_sections?.title;
    const context = [nb, sec].filter(Boolean).join(" › ") || null;
    items.push({
      kind: "page",
      id: p.id,
      title: p.title,
      deleted_at: p.deleted_at,
      context,
    });
  }

  return items.sort((a, b) => b.deleted_at.localeCompare(a.deleted_at));
}
