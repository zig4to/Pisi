import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { searchPages } from "@/lib/data/search";
import SearchBox from "@/components/search/SearchBox";
import { IconSearch } from "@/components/ui/icons";

export default async function IskanjePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  const supabase = await createClient();
  const results = query.length >= 2 ? await searchPages(supabase, query) : [];

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-6 pt-14 md:pt-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Iskanje
      </h1>

      <SearchBox initialQuery={query} />

      {query.length >= 2 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {results.length === 0
            ? "Ni zadetkov."
            : `${results.length} ${results.length === 1 ? "zadetek" : "zadetkov"}`}
        </p>
      )}

      {query.length < 2 && (
        <p className="flex items-center gap-2 text-sm text-gray-400">
          <IconSearch />
          Vpiši vsaj 2 znaka za iskanje po naslovih in vsebini strani.
        </p>
      )}

      <ul className="space-y-2">
        {results.map((r) => (
          <li key={r.page_id}>
            <Link
              href={`/belezke/${r.notebook_id}/${r.section_id}/${r.page_id}`}
              className="block rounded-lg border border-gray-200 bg-white p-3 hover:border-blue-300 hover:bg-blue-50/40 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-800 dark:hover:bg-blue-950/20"
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {r.title}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                {r.notebook_title} › {r.section_title}
              </p>
              {r.snippet && (
                <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                  {r.snippet}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
