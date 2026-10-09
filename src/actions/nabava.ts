"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string };

function revalidate() {
  revalidatePath("/nabava", "layout");
}

function duplicateName(message: string) {
  return message.includes("pisi_nabava_categories_name_unique");
}

// ============ Kategorije ============

export async function createCategoryAction(
  name: string
): Promise<{ id: string; name: string } | { error: string }> {
  const clean = name.trim();
  if (!clean) return { error: "Ime kategorije je obvezno." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pisi_nabava_categories")
    .insert({ name: clean })
    .select("id, name")
    .single();

  if (error) {
    return {
      error: duplicateName(error.message)
        ? "Kategorija s tem imenom že obstaja."
        : "Napaka pri dodajanju kategorije: " + error.message,
    };
  }
  revalidate();
  return data;
}

export async function renameCategoryAction(id: string, name: string): Promise<Result> {
  const clean = name.trim();
  if (!clean) return { error: "Ime kategorije je obvezno." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("pisi_nabava_categories")
    .update({ name: clean })
    .eq("id", id);
  if (error) {
    return {
      error: duplicateName(error.message) ? "Kategorija s tem imenom že obstaja." : error.message,
    };
  }
  revalidate();
  return {};
}

/** Izdelki izbrisane kategorije ostanejo „Brez kategorije“ (on delete set null). */
export async function deleteCategoryAction(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("pisi_nabava_categories").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

// ============ Izdelki ============

export type NabavaItemInput = {
  name: string;
  categoryId: string | null;
  store: string;
  urls: string[];
  /** true = Hitra nabava, false = Nenujno */
  urgent: boolean;
};

function normalize(input: NabavaItemInput) {
  const urls = input.urls
    .map((u) => u.trim())
    .filter(Boolean)
    // „trgovina.si/izdelek“ -> „https://trgovina.si/izdelek“, da link deluje
    .map((u) => (/^https?:\/\//i.test(u) ? u : "https://" + u));
  return {
    name: input.name.trim(),
    category_id: input.categoryId,
    store: input.store.trim(),
    urls: [...new Set(urls)],
    priority: input.urgent ? ("urgent" as const) : ("normal" as const),
  };
}

export async function createItemAction(input: NabavaItemInput): Promise<Result> {
  const row = normalize(input);
  if (!row.name) return { error: "Ime izdelka je obvezno." };
  const supabase = await createClient();
  const { error } = await supabase.from("pisi_nabava_items").insert(row);
  if (error) return { error: "Napaka pri shranjevanju: " + error.message };
  revalidate();
  return {};
}

export async function updateItemAction(id: string, input: NabavaItemInput): Promise<Result> {
  const row = normalize(input);
  if (!row.name) return { error: "Ime izdelka je obvezno." };
  const supabase = await createClient();
  const { error } = await supabase.from("pisi_nabava_items").update(row).eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function setBoughtAction(id: string, bought: boolean): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pisi_nabava_items")
    .update({ bought_at: bought ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function deleteItemAction(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("pisi_nabava_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

/** Počisti kupljene v enem zavihku (Hitra nabava / Nenujno) ali brez `priority` vse. */
export async function clearBoughtAction(priority?: "urgent" | "normal"): Promise<Result> {
  const supabase = await createClient();
  let query = supabase.from("pisi_nabava_items").delete().not("bought_at", "is", null);
  if (priority) query = query.eq("priority", priority);
  const { error } = await query;
  if (error) return { error: error.message };
  revalidate();
  return {};
}
