"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isWithin } from "@/lib/kesiii/tree";

type Result = { error?: string };

function revalidate() {
  revalidatePath("/kesiii", "layout");
}

async function householdId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data, error } = await supabase.rpc("pisi_kesiii_ensure_household");
  if (error) throw error;
  return data;
}

// ============ Lokacije ============

export async function createLocationAction(
  name: string,
  parentId: string | null
): Promise<{ id: string; name: string; parent_id: string | null } | { error: string }> {
  const clean = name.trim();
  if (!clean) return { error: "Ime lokacije je obvezno." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pisi_kesiii_locations")
    .insert({
      household_id: await householdId(supabase),
      parent_id: parentId,
      name: clean,
    })
    .select("id, name, parent_id")
    .single();

  if (error) return { error: "Napaka pri dodajanju lokacije: " + error.message };
  revalidate();
  return data;
}

/** Hitro dodajanje več sob naenkrat (prvi zagon). */
export async function createRoomsAction(names: string[]): Promise<Result> {
  const clean = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (clean.length === 0) return { error: "Izberi vsaj eno sobo." };

  const supabase = await createClient();
  const hid = await householdId(supabase);
  const { error } = await supabase
    .from("pisi_kesiii_locations")
    .insert(clean.map((name) => ({ household_id: hid, parent_id: null, name })));

  if (error) return { error: "Napaka pri dodajanju sob: " + error.message };
  revalidate();
  return {};
}

export async function renameLocationAction(id: string, name: string): Promise<Result> {
  const clean = name.trim();
  if (!clean) return { error: "Ime lokacije je obvezno." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("pisi_kesiii_locations")
    .update({ name: clean })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function moveLocationAction(
  id: string,
  newParentId: string | null
): Promise<Result> {
  const supabase = await createClient();
  const { data: locs, error: loadError } = await supabase
    .from("pisi_kesiii_locations")
    .select("id, parent_id, name");
  if (loadError) return { error: loadError.message };

  if (newParentId && isWithin(locs ?? [], id, newParentId)) {
    return { error: "Lokacije ne moreš premakniti vase ali v svojo podlokacijo." };
  }

  const { error } = await supabase
    .from("pisi_kesiii_locations")
    .update({ parent_id: newParentId })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function deleteLocationAction(id: string): Promise<Result> {
  const supabase = await createClient();

  const [children, items] = await Promise.all([
    supabase
      .from("pisi_kesiii_locations")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", id),
    supabase
      .from("pisi_kesiii_items")
      .select("id", { count: "exact", head: true })
      .eq("location_id", id),
  ]);
  if ((children.count ?? 0) > 0) {
    return { error: "Lokacija ima podlokacije. Najprej jih premakni ali izbriši." };
  }
  if ((items.count ?? 0) > 0) {
    return { error: "Na lokaciji so shranjeni predmeti. Najprej jih premakni." };
  }

  const { error } = await supabase.from("pisi_kesiii_locations").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

// ============ Predmeti ============

export async function createItemAction(input: {
  name: string;
  note: string;
  locationId: string | null;
  detail: string;
}): Promise<{ id: string } | { error: string }> {
  const name = input.name.trim();
  if (!name) return { error: "Ime predmeta je obvezno." };
  if (!input.locationId && !input.detail.trim()) {
    return { error: "Izberi lokacijo ali opiši, kje je predmet." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pisi_kesiii_items")
    .insert({
      household_id: await householdId(supabase),
      name,
      note: input.note.trim(),
      location_id: input.locationId,
      location_detail: input.detail.trim(),
    })
    .select("id")
    .single();

  if (error) return { error: "Napaka pri shranjevanju: " + error.message };
  revalidate();
  return data;
}

export async function updateItemAction(
  id: string,
  input: { name: string; note: string }
): Promise<Result> {
  const name = input.name.trim();
  if (!name) return { error: "Ime predmeta je obvezno." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("pisi_kesiii_items")
    .update({ name, note: input.note.trim() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

/** Premik predmeta; zgodovino zapiše trigger v bazi. */
export async function moveItemAction(
  id: string,
  locationId: string | null,
  detail: string
): Promise<Result> {
  if (!locationId && !detail.trim()) {
    return { error: "Izberi lokacijo ali opiši, kje je predmet." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("pisi_kesiii_items")
    .update({ location_id: locationId, location_detail: detail.trim() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function deleteItemAction(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("pisi_kesiii_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

// ============ Gospodinjstvo ============

export async function renameHouseholdAction(name: string): Promise<Result> {
  const clean = name.trim();
  if (!clean) return { error: "Ime je obvezno." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("pisi_kesiii_households")
    .update({ name: clean })
    .eq("id", await householdId(supabase));
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function setDisplayNameAction(name: string): Promise<Result> {
  const clean = name.trim();
  if (!clean) return { error: "Ime je obvezno." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nisi prijavljen." };
  const { error } = await supabase
    .from("pisi_kesiii_members")
    .update({ display_name: clean })
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function joinHouseholdAction(code: string): Promise<Result> {
  const clean = code.trim();
  if (!clean) return { error: "Vpiši kodo." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("pisi_kesiii_join", { code: clean });
  if (error) return { error: error.message };
  if (!data) return { error: "Gospodinjstva s to kodo ni." };
  revalidate();
  return {};
}

export async function leaveHouseholdAction(): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("pisi_kesiii_leave");
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function newJoinCodeAction(): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("pisi_kesiii_new_code");
  if (error) return { error: error.message };
  revalidate();
  return {};
}
