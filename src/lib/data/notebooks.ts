import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Notebook,
  NotebookWithSections,
  Section,
} from "@/lib/types/database.types";

type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Drevo vseh aktivnih beležk prijavljenega uporabnika z gnezdenimi sekcijami.
 * Razvrščeno: pripete (`is_pinned`) najprej, nato po `position` naraščajoče.
 */
export async function getNotebookTree(
  supabase: TypedSupabaseClient
): Promise<NotebookWithSections[]> {
  const [notebooksRes, sectionsRes] = await Promise.all([
    supabase
      .from("pisi_notebooks")
      .select("*")
      .is("deleted_at", null)
      .order("is_pinned", { ascending: false })
      .order("position", { ascending: true }),
    supabase
      .from("pisi_sections")
      .select("*")
      .is("deleted_at", null)
      .order("is_pinned", { ascending: false })
      .order("position", { ascending: true }),
  ]);

  if (notebooksRes.error) throw notebooksRes.error;
  if (sectionsRes.error) throw sectionsRes.error;

  const sectionsByNotebook = new Map<string, Section[]>();
  for (const section of sectionsRes.data ?? []) {
    const list = sectionsByNotebook.get(section.notebook_id) ?? [];
    list.push(section);
    sectionsByNotebook.set(section.notebook_id, list);
  }

  return (notebooksRes.data ?? []).map((nb) => ({
    ...nb,
    sections: sectionsByNotebook.get(nb.id) ?? [],
  }));
}

export async function getNotebookById(
  supabase: TypedSupabaseClient,
  id: string
): Promise<Notebook> {
  const { data, error } = await supabase
    .from("pisi_notebooks")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) throw error;
  return data;
}

export async function getNotebookCount(
  supabase: TypedSupabaseClient
): Promise<number> {
  const { count, error } = await supabase
    .from("pisi_notebooks")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null);

  if (error) throw error;
  return count ?? 0;
}
