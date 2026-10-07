import { createClient } from "@/lib/supabase/server";
import { getKesiiiContext, getRecentItems, searchItems } from "@/lib/data/kesiii";
import KesiiiSearch from "@/components/kesiii/KesiiiSearch";
import ItemList from "@/components/kesiii/ItemList";
import RoomsSetup from "@/components/kesiii/RoomsSetup";

export default async function KesiiiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  const supabase = await createClient();
  const { locations } = await getKesiiiContext(supabase);

  if (locations.length === 0) return <RoomsSetup />;

  const [recent, results] = await Promise.all([
    getRecentItems(supabase),
    query.length >= 2 ? searchItems(supabase, query, locations) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-4">
      <KesiiiSearch initialQuery={query} locations={locations} />

      {results ? (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {results.length === 0
              ? "Ni zadetkov."
              : `${results.length} ${results.length === 1 ? "zadetek" : "zadetkov"}`}
          </p>
          <ItemList items={results} locations={locations} empty="" />
        </>
      ) : (
        <>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Nazadnje dodano ali premaknjeno
          </h2>
          <ItemList
            items={recent}
            locations={locations}
            empty="Še ni predmetov. Dodaj prvega z gumbom +."
          />
        </>
      )}
    </div>
  );
}
