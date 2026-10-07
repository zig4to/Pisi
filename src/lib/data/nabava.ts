import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, NabavaCategory, NabavaItem } from "@/lib/types/database.types";

type TypedSupabaseClient = SupabaseClient<Database>;

/** Vse kategorije in izdelki uporabnika (RLS omeji na lastne). */
export async function getNabava(
  supabase: TypedSupabaseClient
): Promise<{ categories: NabavaCategory[]; items: NabavaItem[] }> {
  const [categories, items] = await Promise.all([
    supabase.from("pisi_nabava_categories").select("*").order("name"),
    supabase.from("pisi_nabava_items").select("*").order("name"),
  ]);
  if (categories.error) throw categories.error;
  if (items.error) throw items.error;
  return { categories: categories.data ?? [], items: items.data ?? [] };
}
