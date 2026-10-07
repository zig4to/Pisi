import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  KesiiiHousehold,
  KesiiiItem,
  KesiiiLocation,
  KesiiiMember,
  KesiiiMove,
} from "@/lib/types/database.types";
import { subtreeIds } from "@/lib/kesiii/tree";

type TypedSupabaseClient = SupabaseClient<Database>;

export type KesiiiContext = {
  household: KesiiiHousehold;
  members: KesiiiMember[];
  locations: KesiiiLocation[];
};

/**
 * Gospodinjstvo trenutnega uporabnika (ob prvem obisku se ustvari), njegovi
 * člani in vse lokacije. RLS omeji vse poizvedbe na to gospodinjstvo.
 */
export async function getKesiiiContext(
  supabase: TypedSupabaseClient
): Promise<KesiiiContext> {
  const { data: householdId, error: rpcError } = await supabase.rpc(
    "pisi_kesiii_ensure_household"
  );
  if (rpcError) throw rpcError;

  const [household, members, locations] = await Promise.all([
    supabase
      .from("pisi_kesiii_households")
      .select("*")
      .eq("id", householdId)
      .single(),
    supabase
      .from("pisi_kesiii_members")
      .select("*")
      .eq("household_id", householdId)
      .order("joined_at"),
    supabase
      .from("pisi_kesiii_locations")
      .select("*")
      .eq("household_id", householdId),
  ]);
  if (household.error) throw household.error;
  if (members.error) throw members.error;
  if (locations.error) throw locations.error;

  return {
    household: household.data,
    members: members.data ?? [],
    locations: locations.data ?? [],
  };
}

/** Zadnje dodani ali premaknjeni predmeti. */
export async function getRecentItems(
  supabase: TypedSupabaseClient,
  limit = 20
): Promise<KesiiiItem[]> {
  const { data, error } = await supabase
    .from("pisi_kesiii_items")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/**
 * Iskanje po imenu, opombi in podrobnosti lokacije, pa tudi po imenih
 * lokacij („garaža“ najde vse, kar je kjerkoli v garaži).
 */
export async function searchItems(
  supabase: TypedSupabaseClient,
  rawQuery: string,
  locations: KesiiiLocation[]
): Promise<KesiiiItem[]> {
  const query = rawQuery.trim();
  if (query.length < 2) return [];

  // Za PostgREST `or` filter: odstrani znake, ki bi razbili razčlenjevanje,
  // in ubeži `%`/`_` v LIKE vzorcu (enako kot `lib/data/search.ts`).
  const sanitized = query.replace(/["(),]/g, " ").trim();
  if (sanitized.length < 2) return [];
  const escaped = sanitized.replace(/[%_\\]/g, (m) => `\\${m}`);
  const pattern = `%${escaped}%`;

  const lower = sanitized.toLowerCase();
  const locIds = new Set<string>();
  for (const loc of locations) {
    if (loc.name.toLowerCase().includes(lower)) {
      for (const id of subtreeIds(locations, loc.id)) locIds.add(id);
    }
  }

  const filters = [
    `name.ilike."${pattern}"`,
    `note.ilike."${pattern}"`,
    `location_detail.ilike."${pattern}"`,
  ];
  if (locIds.size > 0) filters.push(`location_id.in.(${[...locIds].join(",")})`);

  const { data, error } = await supabase
    .from("pisi_kesiii_items")
    .select("*")
    .or(filters.join(","))
    .order("name")
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

/** Predmeti, shranjeni neposredno na teh lokacijah. */
export async function getItemsInLocations(
  supabase: TypedSupabaseClient,
  locationIds: string[]
): Promise<KesiiiItem[]> {
  if (locationIds.length === 0) return [];
  const { data, error } = await supabase
    .from("pisi_kesiii_items")
    .select("*")
    .in("location_id", locationIds)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

/** Število predmetov po lokaciji (neposredno). */
export async function getItemCounts(
  supabase: TypedSupabaseClient
): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("pisi_kesiii_items")
    .select("location_id");
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.location_id) continue;
    counts.set(row.location_id, (counts.get(row.location_id) ?? 0) + 1);
  }
  return counts;
}

export async function getItem(
  supabase: TypedSupabaseClient,
  id: string
): Promise<KesiiiItem | null> {
  const { data, error } = await supabase
    .from("pisi_kesiii_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getItemMoves(
  supabase: TypedSupabaseClient,
  itemId: string
): Promise<KesiiiMove[]> {
  const { data, error } = await supabase
    .from("pisi_kesiii_item_moves")
    .select("*")
    .eq("item_id", itemId)
    .order("moved_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
