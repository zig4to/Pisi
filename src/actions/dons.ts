"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DonsFormState = { error?: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function nextDonsPosition(
  supabase: Awaited<ReturnType<typeof createClient>>,
  forDate: string
): Promise<number> {
  const { data } = await supabase
    .from("pisi_dons_tasks")
    .select("position")
    .eq("for_date", forDate)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.position ?? 0) + 1;
}

export async function addDonsTaskAction(
  title: string,
  forDate: string
): Promise<DonsFormState> {
  const clean = title.trim();
  if (!clean) return { error: "Opravilo ne sme biti prazno." };
  if (!DATE_RE.test(forDate)) return { error: "Neveljaven datum." };

  const supabase = await createClient();
  const position = await nextDonsPosition(supabase, forDate);

  const { error } = await supabase
    .from("pisi_dons_tasks")
    .insert({ title: clean.slice(0, 500), for_date: forDate, position });

  if (error) return { error: "Napaka pri dodajanju: " + error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function toggleDonsTaskAction(
  id: string,
  done: boolean
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("pisi_dons_tasks")
    .update({ done, done_at: done ? new Date().toISOString() : null })
    .eq("id", id);
  revalidatePath("/", "layout");
}

export async function renameDonsTaskAction(
  id: string,
  title: string
): Promise<void> {
  const clean = title.trim();
  if (!clean) return;
  const supabase = await createClient();
  await supabase
    .from("pisi_dons_tasks")
    .update({ title: clean.slice(0, 500) })
    .eq("id", id);
  revalidatePath("/", "layout");
}

export async function deleteDonsTaskAction(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("pisi_dons_tasks").delete().eq("id", id);
  revalidatePath("/", "layout");
}

/**
 * Prenese neopravljena opravila iz preteklih dni na `todayStr` (lokalni „danes“
 * z odjemalca). RLS omeji spremembo na trenutnega uporabnika.
 */
export async function rolloverDonsTasksAction(todayStr: string): Promise<void> {
  if (!DATE_RE.test(todayStr)) return;
  const supabase = await createClient();
  await supabase
    .from("pisi_dons_tasks")
    .update({ for_date: todayStr })
    .eq("done", false)
    .lt("for_date", todayStr);
  revalidatePath("/", "layout");
}
