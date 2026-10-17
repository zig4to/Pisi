import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  NabavaCategory,
  NabavaItem,
  Project,
} from "@/lib/types/database.types";

export type NabavaProject = Pick<Project, "id" | "title" | "color">;

type TypedSupabaseClient = SupabaseClient<Database>;

/** Vse kategorije, izdelki in projekti (za oznako izdelka) uporabnika (RLS omeji na lastne). */
export async function getNabava(supabase: TypedSupabaseClient): Promise<{
  categories: NabavaCategory[];
  items: NabavaItem[];
  projects: NabavaProject[];
}> {
  const [categories, items, projects] = await Promise.all([
    supabase.from("pisi_nabava_categories").select("*").order("name"),
    supabase.from("pisi_nabava_items").select("*").order("name"),
    supabase.from("pisi_projects").select("id, title, color"),
  ]);
  if (categories.error) throw categories.error;
  if (items.error) throw items.error;
  if (projects.error) throw projects.error;
  return {
    categories: categories.data ?? [],
    items: items.data ?? [],
    projects: projects.data ?? [],
  };
}
