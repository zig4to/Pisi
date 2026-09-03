"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TiptapDoc } from "@/lib/types/database.types";

async function nextPagePosition(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sectionId: string
): Promise<number> {
  const { data } = await supabase
    .from("pisi_pages")
    .select("position")
    .eq("section_id", sectionId)
    .is("deleted_at", null)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.position ?? 0) + 1;
}

export async function createPageAction(
  notebookId: string,
  sectionId: string
): Promise<void> {
  const supabase = await createClient();
  const position = await nextPagePosition(supabase, sectionId);

  const { data, error } = await supabase
    .from("pisi_pages")
    .insert({ section_id: sectionId, title: "Nova stran", position })
    .select("id")
    .single();

  if (error) throw new Error("Napaka pri ustvarjanju strani: " + error.message);

  revalidatePath("/", "layout");
  redirect(`/belezke/${notebookId}/${sectionId}/${data.id}`);
}

export async function updatePageContentAction(
  pageId: string,
  content: TiptapDoc,
  contentText: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pisi_pages")
    .update({ content, content_text: contentText.slice(0, 200_000) })
    .eq("id", pageId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function renamePageAction(
  pageId: string,
  title: string
): Promise<{ ok: boolean }> {
  const clean = title.trim() || "Nova stran";
  const supabase = await createClient();
  await supabase.from("pisi_pages").update({ title: clean }).eq("id", pageId);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function togglePinPageAction(pageId: string, isPinned: boolean) {
  const supabase = await createClient();
  await supabase
    .from("pisi_pages")
    .update({ is_pinned: isPinned })
    .eq("id", pageId);
  revalidatePath("/", "layout");
}

export async function reorderPagesAction(orderedIds: string[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("pisi_pages").update({ position: index + 1 }).eq("id", id)
    )
  );
  revalidatePath("/", "layout");
}

export async function movePageAction(pageId: string, targetSectionId: string) {
  const supabase = await createClient();
  const position = await nextPagePosition(supabase, targetSectionId);
  await supabase
    .from("pisi_pages")
    .update({ section_id: targetSectionId, position })
    .eq("id", pageId);
  revalidatePath("/", "layout");
}

export async function trashPageAction(
  pageId: string,
  notebookId: string,
  sectionId: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pisi_pages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", pageId);

  if (error) throw new Error("Napaka pri brisanju strani: " + error.message);

  revalidatePath("/", "layout");
  redirect(`/belezke/${notebookId}/${sectionId}`);
}
