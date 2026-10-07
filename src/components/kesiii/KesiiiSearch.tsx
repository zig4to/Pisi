"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import ItemDialog from "@/components/kesiii/ItemDialog";
import type { PickerLocation } from "@/components/kesiii/LocationPicker";
import { IconPlus, IconSearch } from "@/components/ui/icons";

/** Iskalno polje (sproti posodablja ?q=) + gumb za nov predmet. */
export default function KesiiiSearch({
  initialQuery,
  locations,
}: {
  initialQuery: string;
  locations: PickerLocation[];
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [adding, setAdding] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      const q = value.trim();
      router.replace(q ? `/kesiii?q=${encodeURIComponent(q)}` : "/kesiii");
    }, 250);
    return () => clearTimeout(t);
  }, [value, router]);

  return (
    <div className="flex gap-2">
      <div className="flex flex-1 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 focus-within:border-emerald-500 dark:border-gray-700 dark:bg-gray-900">
        <IconSearch className="h-4 w-4 flex-shrink-0 text-gray-400" />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Kaj iščeš?"
          className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
        />
      </div>
      <Button
        type="button"
        onClick={() => setAdding(true)}
        className="bg-emerald-600 hover:bg-emerald-700"
      >
        <IconPlus />
        <span className="hidden sm:inline">Dodaj</span>
      </Button>

      {adding && (
        <ItemDialog
          onClose={() => setAdding(false)}
          mode={{ kind: "create" }}
          locations={locations}
        />
      )}
    </div>
  );
}
