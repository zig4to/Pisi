"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNotebookCount } from "@/lib/data/notebooks";
import { nextColor } from "@/lib/utils/color";

export type NotebookFormState = { error?: string };

async function nextNotebookPosition(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<number> {
  const { data } = await supabase
    .from("pisi_notebooks")
    .select("position")
    .is("deleted_at", null)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.position ?? 0) + 1;
}

export async function createNotebookAction(
  _prevState: NotebookFormState,
  formData: FormData
): Promise<NotebookFormState> {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Ime beležke je obvezno." };

  const supabase = await createClient();
  const count = await getNotebookCount(supabase);
  const position = await nextNotebookPosition(supabase);

  const { data, error } = await supabase
    .from("pisi_notebooks")
    .insert({ title, color: nextColor(count), position })
    .select("id")
    .single();

  if (error) return { error: "Napaka pri ustvarjanju beležke: " + error.message };

  revalidatePath("/", "layout");
  redirect(`/belezke/${data.id}`);
}

export async function renameNotebookAction(id: string, title: string) {
  const clean = title.trim();
  if (!clean) return;
  const supabase = await createClient();
  await supabase.from("pisi_notebooks").update({ title: clean }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function setNotebookColorAction(id: string, color: string) {
  const supabase = await createClient();
  await supabase.from("pisi_notebooks").update({ color }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function togglePinNotebookAction(id: string, isPinned: boolean) {
  const supabase = await createClient();
  await supabase
    .from("pisi_notebooks")
    .update({ is_pinned: isPinned })
    .eq("id", id);
  revalidatePath("/", "layout");
}

export async function reorderNotebooksAction(orderedIds: string[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("pisi_notebooks").update({ position: index + 1 }).eq("id", id)
    )
  );
  revalidatePath("/", "layout");
}

export async function trashNotebookAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pisi_notebooks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error("Napaka pri brisanju beležke: " + error.message);

  revalidatePath("/", "layout");
  redirect("/");
}
