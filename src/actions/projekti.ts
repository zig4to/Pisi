"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { IMAGE_BUCKET } from "@/lib/utils/images";
import { uniqueColor } from "@/lib/utils/color";
import { stepDoneEntry } from "@/lib/utils/projekti";

type Result = { error?: string };

function revalidate() {
  revalidatePath("/projekti", "layout");
  // izdelki projektov so tudi v Nabavi
  revalidatePath("/nabava", "layout");
}

// ============ Projekt ============

export async function createProjectAction(
  title: string
): Promise<{ id: string } | { error: string }> {
  const clean = title.trim();
  if (!clean) return { error: "Ime projekta je obvezno." };
  const supabase = await createClient();
  // barva, ki je noben drug projekt še nima
  const { data: existing } = await supabase.from("pisi_projects").select("color");
  const color = uniqueColor((existing ?? []).map((p) => p.color));
  const { data, error } = await supabase
    .from("pisi_projects")
    .insert({ title: clean, color })
    .select("id")
    .single();
  if (error) return { error: "Napaka pri ustvarjanju projekta: " + error.message };
  revalidate();
  return data;
}

export type ProjectInput = {
  title?: string;
  notes?: string;
  links?: string[];
};

export async function updateProjectAction(id: string, input: ProjectInput): Promise<Result> {
  const row: { title?: string; notes?: string; links?: string[] } = {};
  if (input.title !== undefined) {
    row.title = input.title.trim();
    if (!row.title) return { error: "Ime projekta je obvezno." };
  }
  if (input.notes !== undefined) row.notes = input.notes;
  if (input.links !== undefined) {
    const links = input.links
      .map((u) => u.trim())
      .filter(Boolean)
      // „trgovina.si/izdelek“ -> „https://trgovina.si/izdelek“, da link deluje
      .map((u) => (/^https?:\/\//i.test(u) ? u : "https://" + u));
    row.links = [...new Set(links)];
  }
  const supabase = await createClient();
  const { error } = await supabase.from("pisi_projects").update(row).eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

/** `done` = true označi projekt kot dokončan, false ga ponovno odpre. */
export async function completeProjectAction(id: string, done: boolean): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pisi_projects")
    .update({ completed_at: done ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

/** Izbriše projekt z dnevnikom, koraki, slikami in izdelki nabave (on delete cascade). */
export async function deleteProjectAction(id: string): Promise<Result> {
  const supabase = await createClient();
  const { data: images } = await supabase
    .from("pisi_project_images")
    .select("path")
    .eq("project_id", id);
  const { error } = await supabase.from("pisi_projects").delete().eq("id", id);
  if (error) return { error: error.message };
  if (images?.length) {
    await supabase.storage.from(IMAGE_BUCKET).remove(images.map((i) => i.path));
  }
  revalidate();
  return {};
}

// ============ Dnevnik dela ============

export async function addEntryAction(projectId: string, body: string): Promise<Result> {
  const clean = body.trim();
  if (!clean) return { error: "Zapis je prazen." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("pisi_project_entries")
    .insert({ project_id: projectId, body: clean });
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function updateEntryAction(id: string, body: string): Promise<Result> {
  const clean = body.trim();
  if (!clean) return { error: "Zapis je prazen." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("pisi_project_entries")
    .update({ body: clean })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function deleteEntryAction(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("pisi_project_entries").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

// ============ Koraki ============

export async function addStepAction(
  projectId: string,
  title: string,
  position: number
): Promise<Result> {
  const clean = title.trim();
  if (!clean) return { error: "Korak je prazen." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("pisi_project_steps")
    .insert({ project_id: projectId, title: clean, position });
  if (error) return { error: error.message };
  revalidate();
  return {};
}

/**
 * Obkljukan korak doda zapis v dnevnik dela („Opravljen korak: …“);
 * odkljukan ta samodejni zapis spet odstrani.
 */
export async function toggleStepAction(id: string, done: boolean): Promise<Result> {
  const supabase = await createClient();
  const { data: before, error: readError } = await supabase
    .from("pisi_project_steps")
    .select("project_id, title, done_at")
    .eq("id", id)
    .single();
  if (readError) return { error: readError.message };

  const { error } = await supabase
    .from("pisi_project_steps")
    .update({ done_at: done ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: error.message };

  const body = stepDoneEntry(before.title);
  if (done && !before.done_at) {
    const { error: entryError } = await supabase
      .from("pisi_project_entries")
      .insert({ project_id: before.project_id, body });
    if (entryError) return { error: entryError.message };
  } else if (!done && before.done_at) {
    // samo zapis, nastal ob tem obkljukanju (ne starejših z enakim besedilom)
    const { error: entryError } = await supabase
      .from("pisi_project_entries")
      .delete()
      .eq("project_id", before.project_id)
      .eq("body", body)
      .gte("created_at", before.done_at);
    if (entryError) return { error: entryError.message };
  }

  revalidate();
  return {};
}

/**
 * Doda korak na splošni seznam opravil v aplikaciji Vzlet (pisi_vzlet_backlog,
 * isti Supabase projekt). Ime projekta je v oklepaju, da je v Vzletu jasno,
 * kam korak sodi. Vzlet ga od tam prestavi na danes ali jutri.
 * `project_step_id` poveže opravilo s korakom: ko ga v Vzletu odkljukaš, se
 * korak obkljuka sam (sprožilci v 0012_projekti_vzlet_sync.sql).
 */
export async function addStepToVzletAction(id: string): Promise<Result> {
  const supabase = await createClient();
  const { data: step, error: readError } = await supabase
    .from("pisi_project_steps")
    .select("title, project_id")
    .eq("id", id)
    .single();
  if (readError) return { error: readError.message };
  const { data: project } = await supabase
    .from("pisi_projects")
    .select("title")
    .eq("id", step.project_id)
    .maybeSingle();

  // na konec seznama — enako kot nextBacklogPosition v Vzletu
  const { data: last } = await supabase
    .from("pisi_vzlet_backlog")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const title = project ? `${step.title} (${project.title})` : step.title;
  const { error } = await supabase
    .from("pisi_vzlet_backlog")
    .insert({
      title: title.slice(0, 500),
      position: (last?.position ?? 0) + 1,
      project_step_id: id,
    });
  if (error) return { error: "Dodajanje v Vzlet ni uspelo: " + error.message };

  const { error: markError } = await supabase
    .from("pisi_project_steps")
    .update({ vzlet_added_at: new Date().toISOString() })
    .eq("id", id);
  if (markError) return { error: markError.message };
  revalidate();
  return {};
}

export async function renameStepAction(id: string, title: string): Promise<Result> {
  const clean = title.trim();
  if (!clean) return { error: "Korak je prazen." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("pisi_project_steps")
    .update({ title: clean })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function deleteStepAction(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("pisi_project_steps").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

/** Nov vrstni red korakov (seznam ID-jev od prvega do zadnjega). */
export async function reorderStepsAction(ids: string[]): Promise<Result> {
  const supabase = await createClient();
  const results = await Promise.all(
    ids.map((id, index) =>
      supabase.from("pisi_project_steps").update({ position: index }).eq("id", id)
    )
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };
  revalidate();
  return {};
}

// ============ Slike ============

/** Sliko naloži odjemalec v Storage (uploadImage); tu jo le zapišemo k projektu. */
export async function addImageAction(projectId: string, path: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pisi_project_images")
    .insert({ project_id: projectId, path });
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function deleteImageAction(id: string): Promise<Result> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pisi_project_images")
    .delete()
    .eq("id", id)
    .select("path")
    .maybeSingle();
  if (error) return { error: error.message };
  if (data) await supabase.storage.from(IMAGE_BUCKET).remove([data.path]);
  revalidate();
  return {};
}
