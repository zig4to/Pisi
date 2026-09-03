"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getTags } from "@/lib/data/tags";
import { nextColor } from "@/lib/utils/color";

export type TagFormState = { error?: string };

export async function createTagAction(
  _prevState: TagFormState,
  formData: FormData
): Promise<TagFormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Ime značke je obvezno." };

  const supabase = await createClient();
  const existing = await getTags(supabase);
  if (existing.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
    return { error: "Značka s tem imenom že obstaja." };
  }

  const { error } = await supabase
    .from("pisi_tags")
    .insert({ name, color: nextColor(existing.length) });

  if (error) return { error: "Napaka pri ustvarjanju značke: " + error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function renameTagAction(id: string, name: string) {
  const clean = name.trim();
  if (!clean) return;
  const supabase = await createClient();
  await supabase.from("pisi_tags").update({ name: clean }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function setTagColorAction(id: string, color: string) {
  const supabase = await createClient();
  await supabase.from("pisi_tags").update({ color }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function deleteTagAction(id: string) {
  const supabase = await createClient();
  await supabase.from("pisi_tags").delete().eq("id", id);
  revalidatePath("/", "layout");
}

/** Nastavi celoten nabor značk za stran (doda manjkajoče, odstrani odvečne). */
export async function setPageTagsAction(pageId: string, tagIds: string[]) {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("pisi_page_tags")
    .select("tag_id")
    .eq("page_id", pageId);

  const currentIds = new Set((current ?? []).map((r) => r.tag_id));
  const nextIds = new Set(tagIds);

  const toAdd = tagIds.filter((id) => !currentIds.has(id));
  const toRemove = [...currentIds].filter((id) => !nextIds.has(id));

  if (toAdd.length > 0) {
    await supabase
      .from("pisi_page_tags")
      .insert(toAdd.map((tag_id) => ({ page_id: pageId, tag_id })));
  }
  if (toRemove.length > 0) {
    await supabase
      .from("pisi_page_tags")
      .delete()
      .eq("page_id", pageId)
      .in("tag_id", toRemove);
  }

  revalidatePath("/", "layout");
}

/** Ustvari značko sproti (iz urejevalnika) in vrne njen id. */
export async function createTagInlineAction(
  name: string
): Promise<{ id: string; name: string; color: string } | { error: string }> {
  const clean = name.trim();
  if (!clean) return { error: "Prazno ime." };

  const supabase = await createClient();
  const existing = await getTags(supabase);
  const match = existing.find(
    (t) => t.name.toLowerCase() === clean.toLowerCase()
  );
  if (match) return { id: match.id, name: match.name, color: match.color };

  const { data, error } = await supabase
    .from("pisi_tags")
    .insert({ name: clean, color: nextColor(existing.length) })
    .select("id, name, color")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return data;
}
