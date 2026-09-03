"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { COLOR_PALETTE } from "@/lib/utils/color";

export type SectionFormState = { error?: string };

async function nextSectionPosition(
  supabase: Awaited<ReturnType<typeof createClient>>,
  notebookId: string
): Promise<number> {
  const { data } = await supabase
    .from("pisi_sections")
    .select("position")
    .eq("notebook_id", notebookId)
    .is("deleted_at", null)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.position ?? 0) + 1;
}

/**
 * Barva za novo sekcijo: iz palete izberemo prvo, ki je še ne uporablja niti
 * beležka niti katera od obstoječih sekcij, da se sekcije barvno ločijo od
 * beležke in med seboj. Če so vse barve zasedene, vzamemo katerokoli razen
 * barve beležke.
 */
async function pickSectionColor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  notebookId: string
): Promise<string> {
  const [notebookRes, sectionsRes] = await Promise.all([
    supabase
      .from("pisi_notebooks")
      .select("color")
      .eq("id", notebookId)
      .single(),
    supabase
      .from("pisi_sections")
      .select("color")
      .eq("notebook_id", notebookId)
      .is("deleted_at", null),
  ]);

  const notebookColor = notebookRes.data?.color ?? null;
  const used = new Set<string>();
  if (notebookColor) used.add(notebookColor);
  for (const s of sectionsRes.data ?? []) used.add(s.color);

  const free = COLOR_PALETTE.find((c) => !used.has(c));
  if (free) return free;

  const others = COLOR_PALETTE.filter((c) => c !== notebookColor);
  const index = (sectionsRes.data?.length ?? 0) % others.length;
  return others[index] ?? COLOR_PALETTE[0];
}

export async function createSectionAction(
  notebookId: string,
  _prevState: SectionFormState,
  formData: FormData
): Promise<SectionFormState> {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Ime sekcije je obvezno." };

  const supabase = await createClient();
  const [color, position] = await Promise.all([
    pickSectionColor(supabase, notebookId),
    nextSectionPosition(supabase, notebookId),
  ]);

  const { data, error } = await supabase
    .from("pisi_sections")
    .insert({
      notebook_id: notebookId,
      title,
      color,
      position,
    })
    .select("id")
    .single();

  if (error) return { error: "Napaka pri ustvarjanju sekcije: " + error.message };

  revalidatePath("/", "layout");
  redirect(`/belezke/${notebookId}/${data.id}`);
}

export async function renameSectionAction(id: string, title: string) {
  const clean = title.trim();
  if (!clean) return;
  const supabase = await createClient();
  await supabase.from("pisi_sections").update({ title: clean }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function setSectionColorAction(id: string, color: string) {
  const supabase = await createClient();
  await supabase.from("pisi_sections").update({ color }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function togglePinSectionAction(id: string, isPinned: boolean) {
  const supabase = await createClient();
  await supabase
    .from("pisi_sections")
    .update({ is_pinned: isPinned })
    .eq("id", id);
  revalidatePath("/", "layout");
}

export async function reorderSectionsAction(orderedIds: string[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("pisi_sections").update({ position: index + 1 }).eq("id", id)
    )
  );
  revalidatePath("/", "layout");
}

export async function trashSectionAction(id: string, notebookId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pisi_sections")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error("Napaka pri brisanju sekcije: " + error.message);

  revalidatePath("/", "layout");
  redirect(`/belezke/${notebookId}`);
}
