import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTags, getPagesByTag } from "@/lib/data/tags";
import TagManager from "@/components/tags/TagManager";

export default async function ZnackePage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const supabase = await createClient();

  const tags = await getTags(supabase);
  const activeTag = tags.find((t) => t.id === tag) ?? null;
  const pages = activeTag ? await getPagesByTag(supabase, activeTag.id) : [];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-6 pt-14 md:pt-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Značke
      </h1>

      <TagManager tags={tags} activeTagId={activeTag?.id ?? null} />

      {activeTag && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Strani z značko „{activeTag.name}“
          </h2>
          {pages.length === 0 && (
            <p className="text-sm text-gray-400">Nobena stran nima te značke.</p>
          )}
          <ul className="space-y-2">
            {pages.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/belezke/${p.notebook_id}/${p.section_id}/${p.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-3 hover:border-blue-300 hover:bg-blue-50/40 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-800 dark:hover:bg-blue-950/20"
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {p.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {p.notebook_title} › {p.section_title}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
