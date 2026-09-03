import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Section } from "@/lib/types/database.types";

type TypedSupabaseClient = SupabaseClient<Database>;

export async function getSectionsByNotebook(
  supabase: TypedSupabaseClient,
  notebookId: string
): Promise<Section[]> {
  const { data, error } = await supabase
    .from("pisi_sections")
    .select("*")
    .eq("notebook_id", notebookId)
    .is("deleted_at", null)
    .order("is_pinned", { ascending: false })
    .order("position", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getSectionById(
  supabase: TypedSupabaseClient,
  id: string
): Promise<Section> {
  const { data, error } = await supabase
    .from("pisi_sections")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) throw error;
  return data;
}

export async function getSectionCount(
  supabase: TypedSupabaseClient,
  notebookId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("pisi_sections")
    .select("*", { count: "exact", head: true })
    .eq("notebook_id", notebookId)
    .is("deleted_at", null);

  if (error) throw error;
  return count ?? 0;
}
