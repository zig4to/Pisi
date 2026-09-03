import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tag } from "@/lib/types/database.types";

type TypedSupabaseClient = SupabaseClient<Database>;

export async function getTags(supabase: TypedSupabaseClient): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("pisi_tags")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export type TaggedPage = {
  id: string;
  title: string;
  updated_at: string;
  section_id: string;
  section_title: string;
  notebook_id: string;
  notebook_title: string;
};

export async function getPagesByTag(
  supabase: TypedSupabaseClient,
  tagId: string
): Promise<TaggedPage[]> {
  const { data, error } = await supabase
    .from("pisi_page_tags")
    .select(
      "pisi_pages!inner(id, title, updated_at, deleted_at, pisi_sections!inner(id, title, deleted_at, pisi_notebooks!inner(id, title, deleted_at)))"
    )
    .eq("tag_id", tagId);

  if (error) throw error;

  type Row = {
    pisi_pages: {
      id: string;
      title: string;
      updated_at: string;
      deleted_at: string | null;
      pisi_sections: {
        id: string;
        title: string;
        deleted_at: string | null;
        pisi_notebooks: {
          id: string;
          title: string;
          deleted_at: string | null;
        };
      };
    } | null;
  };

  return ((data ?? []) as unknown as Row[])
    .map((r) => r.pisi_pages)
    .filter(
      (p): p is NonNullable<Row["pisi_pages"]> =>
        !!p &&
        p.deleted_at === null &&
        p.pisi_sections.deleted_at === null &&
        p.pisi_sections.pisi_notebooks.deleted_at === null
    )
    .map((p) => ({
      id: p.id,
      title: p.title,
      updated_at: p.updated_at,
      section_id: p.pisi_sections.id,
      section_title: p.pisi_sections.title,
      notebook_id: p.pisi_sections.pisi_notebooks.id,
      notebook_title: p.pisi_sections.pisi_notebooks.title,
    }))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
