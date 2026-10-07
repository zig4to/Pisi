// Drevo lokacij Kesiii. Lokacij v gospodinjstvu je malo (stotine), zato jih
// naložimo vse naenkrat in drevo / poti sestavimo tu, brez rekurzivnih poizvedb.

type Loc = { id: string; parent_id: string | null; name: string };

export const PATH_SEP = " › ";

const byName = (a: Loc, b: Loc) => a.name.localeCompare(b.name, "sl");

/** Neposredni otroci lokacije (`null` = sobe na vrhu), urejeni po imenu. */
export function childrenOf<T extends Loc>(locs: T[], parentId: string | null): T[] {
  return locs.filter((l) => l.parent_id === parentId).sort(byName);
}

/** Veriga od sobe do lokacije (vključno z njo). */
export function ancestorsOf<T extends Loc>(locs: T[], id: string | null): T[] {
  const map = new Map(locs.map((l) => [l.id, l]));
  const chain: T[] = [];
  let cur = id ? map.get(id) : undefined;
  // varovalka proti ciklom v pokvarjenih podatkih
  while (cur && chain.length < 50) {
    chain.unshift(cur);
    cur = cur.parent_id ? map.get(cur.parent_id) : undefined;
  }
  return chain;
}

/** „Klet › Regal 2 › Modra škatla“ */
export function pathOf(locs: Loc[], id: string | null): string {
  return ancestorsOf(locs, id)
    .map((l) => l.name)
    .join(PATH_SEP);
}

/** Ali je `id` enak `ancestorId` ali leži nekje pod njim? */
export function isWithin(locs: Loc[], ancestorId: string, id: string | null): boolean {
  return ancestorsOf(locs, id).some((l) => l.id === ancestorId);
}

/** Nivoji, za katere ponujamo že uporabljena imena (1 = soba). */
const SUGGEST_LEVELS = new Set([2, 3]);

/**
 * Predlogi imen za novo mesto: imena, ki so že uporabljena na istem nivoju
 * kjerkoli v hiši — 2. nivo („Kovinski regal“) in 3. nivo („Polica 1“,
 * „Polica zgoraj“). Izpusti imena, ki pod tem staršem že obstajajo. Za sobe
 * in globlje nivoje ni predlogov.
 */
export function nameSuggestions(locs: Loc[], parentId: string | null): string[] {
  const level = ancestorsOf(locs, parentId).length + 1;
  if (!SUGGEST_LEVELS.has(level)) return [];

  const levelOf = new Map(locs.map((l) => [l.id, ancestorsOf(locs, l.id).length]));
  const taken = new Set(
    locs.filter((l) => l.parent_id === parentId).map((l) => l.name.toLowerCase())
  );
  const seen = new Map<string, string>();
  for (const l of locs) {
    if (levelOf.get(l.id) !== level) continue;
    const key = l.name.toLowerCase();
    if (!taken.has(key) && !seen.has(key)) seen.set(key, l.name);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, "sl"));
}

/** Vsi id-ji v poddrevesu lokacije (vključno z njo). */
export function subtreeIds(locs: Loc[], rootId: string): Set<string> {
  const ids = new Set([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const l of locs) {
      if (l.parent_id && ids.has(l.parent_id) && !ids.has(l.id)) {
        ids.add(l.id);
        grew = true;
      }
    }
  }
  return ids;
}
