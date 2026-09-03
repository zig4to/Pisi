"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TrashKind } from "@/lib/types/database.types";

const TABLE: Record<TrashKind, "pisi_notebooks" | "pisi_sections" | "pisi_pages"> =
  {
    notebook: "pisi_notebooks",
    section: "pisi_sections",
    page: "pisi_pages",
  };

export async function restoreItemAction(kind: TrashKind, id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from(TABLE[kind])
    .update({ deleted_at: null })
    .eq("id", id);

  if (error) throw new Error("Napaka pri obnovitvi: " + error.message);
  revalidatePath("/", "layout");
}

export async function deleteForeverAction(kind: TrashKind, id: string) {
  const supabase = await createClient();
  // FK `on delete cascade` počisti otroke (sekcije, strani, povezave značk).
  const { error } = await supabase.from(TABLE[kind]).delete().eq("id", id);

  if (error) throw new Error("Napaka pri trajnem brisanju: " + error.message);
  revalidatePath("/", "layout");
}

export async function emptyTrashAction() {
  const supabase = await createClient();
  await supabase.from("pisi_pages").delete().not("deleted_at", "is", null);
  await supabase.from("pisi_sections").delete().not("deleted_at", "is", null);
  await supabase.from("pisi_notebooks").delete().not("deleted_at", "is", null);
  revalidatePath("/", "layout");
}
