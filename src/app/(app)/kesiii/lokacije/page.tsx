import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getItemCounts, getItemsInLocations, getKesiiiContext } from "@/lib/data/kesiii";
import { ancestorsOf, childrenOf, subtreeIds } from "@/lib/kesiii/tree";
import ItemList from "@/components/kesiii/ItemList";
import LocationActions from "@/components/kesiii/LocationActions";
import RoomsSetup from "@/components/kesiii/RoomsSetup";
import { IconChevronRight } from "@/components/ui/icons";

/** Slovenska dvojina: [1, 2, 3–4, 0 in 5+] (po zadnjih dveh števkah). */
function plural(n: number, forms: [string, string, string, string]) {
  const r = n % 100;
  const form = r === 1 ? forms[0] : r === 2 ? forms[1] : r === 3 || r === 4 ? forms[2] : forms[3];
  return `${n} ${form}`;
}

export default async function KesiiiLocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ l?: string }>;
}) {
  const { l } = await searchParams;
  const supabase = await createClient();
  const { locations } = await getKesiiiContext(supabase);

  if (locations.length === 0) return <RoomsSetup />;

  const current = locations.find((loc) => loc.id === l) ?? null;
  const currentId = current?.id ?? null;
  const chain = ancestorsOf(locations, currentId);
  const children = childrenOf(locations, currentId);

  const [counts, itemsHere] = await Promise.all([
    getItemCounts(supabase),
    currentId ? getItemsInLocations(supabase, [currentId]) : Promise.resolve([]),
  ]);
  const totalIn = (id: string) =>
    [...subtreeIds(locations, id)].reduce((sum, sid) => sum + (counts.get(sid) ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* drobtine */}
      <div className="flex flex-wrap items-center gap-1 text-sm">
        <Link
          href="/kesiii/lokacije"
          className={
            currentId
              ? "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              : "font-semibold text-gray-900 dark:text-gray-100"
          }
        >
          Hiša
        </Link>
        {chain.map((loc, i) => (
          <span key={loc.id} className="flex items-center gap-1">
            <IconChevronRight className="h-3 w-3 text-gray-400" />
            <Link
              href={`/kesiii/lokacije?l=${loc.id}`}
              className={
                i === chain.length - 1
                  ? "font-semibold text-gray-900 dark:text-gray-100"
                  : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }
            >
              {loc.name}
            </Link>
          </span>
        ))}
      </div>

      <LocationActions current={current} locations={locations} />

      {children.length > 0 && (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
          {children.map((loc) => {
            const total = totalIn(loc.id);
            const subs = childrenOf(locations, loc.id).length;
            return (
              <li key={loc.id}>
                <Link
                  href={`/kesiii/lokacije?l=${loc.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {loc.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {plural(total, ["predmet", "predmeta", "predmeti", "predmetov"])}
                      {subs > 0 && ` · ${plural(subs, ["mesto", "mesti", "mesta", "mest"])}`}
                    </span>
                  </span>
                  <IconChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {current && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Shranjeno neposredno tukaj
          </h2>
          <ItemList items={itemsHere} locations={locations} empty="Tu ni ničesar." />
        </section>
      )}
    </div>
  );
}
