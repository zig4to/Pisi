import Link from "next/link";
import type { KesiiiItem } from "@/lib/types/database.types";
import { pathOf } from "@/lib/kesiii/tree";
import { IconMapPin } from "@/components/ui/icons";

type Loc = { id: string; parent_id: string | null; name: string };

/** „Klet › Regal 2 · zgornja polica“ — pot lokacije + prosta podrobnost. */
export function itemWhere(locations: Loc[], item: Pick<KesiiiItem, "location_id" | "location_detail">) {
  const path = pathOf(locations, item.location_id);
  return [path, item.location_detail].filter(Boolean).join(" · ") || "Neznano";
}

export default function ItemList({
  items,
  locations,
  empty,
}: {
  items: KesiiiItem[];
  locations: Loc[];
  empty: string;
}) {
  if (items.length === 0) {
    return empty ? <p className="py-6 text-center text-sm text-gray-400">{empty}</p> : null;
  }

  return (
    <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={`/kesiii/predmet/${item.id}`}
            className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60"
          >
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
              {item.name}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
              <IconMapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{itemWhere(locations, item)}</span>
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
