import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  PageListItem,
  PageWithTags,
  Tag,
} from "@/lib/types/database.types";

type TypedSupabaseClient = SupabaseClient<Database>;

export async function getPagesBySection(
  supabase: TypedSupabaseClient,
  sectionId: string
): Promise<PageListItem[]> {
  const { data, error } = await supabase
    .from("pisi_pages")
    .select("id, title, is_pinned, position, updated_at")
    .eq("section_id", sectionId)
    .is("deleted_at", null)
    .order("is_pinned", { ascending: false })
    .order("position", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getPageById(
  supabase: TypedSupabaseClient,
  id: string
): Promise<PageWithTags> {
  const { data, error } = await supabase
    .from("pisi_pages")
    .select("*, pisi_page_tags(pisi_tags(*))")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) throw error;

  const row = data as unknown as {
    pisi_page_tags: { pisi_tags: Tag | null }[] | null;
  } & PageWithTags;

  const tags = (row.pisi_page_tags ?? [])
    .map((pt) => pt.pisi_tags)
    .filter((t): t is Tag => t !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  return { ...row, tags };
}

export async function getFirstPageId(
  supabase: TypedSupabaseClient,
  sectionId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("pisi_pages")
    .select("id")
    .eq("section_id", sectionId)
    .is("deleted_at", null)
    .order("is_pinned", { ascending: false })
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

export async function getPageCount(
  supabase: TypedSupabaseClient,
  sectionId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("pisi_pages")
    .select("*", { count: "exact", head: true })
    .eq("section_id", sectionId)
    .is("deleted_at", null);

  if (error) throw error;
  return count ?? 0;
}
