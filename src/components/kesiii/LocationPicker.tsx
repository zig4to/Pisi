"use client";

import { useState, useTransition } from "react";
import clsx from "@/lib/utils/clsx";
import { createLocationAction } from "@/actions/kesiii";
import { ancestorsOf, childrenOf, nameSuggestions } from "@/lib/kesiii/tree";
import SuggestionChips from "@/components/kesiii/SuggestionChips";
import { IconChevronRight, IconPlus } from "@/components/ui/icons";

export type PickerLocation = { id: string; parent_id: string | null; name: string };

/**
 * Izbira lokacije s pogrezanjem: izbrana lokacija je tista, v kateri si.
 * Tap na podlokacijo gre globlje, drobtine na vrhu nazaj. Novo mesto lahko
 * dodaš sproti na trenutnem nivoju.
 */
export default function LocationPicker({
  locations,
  value,
  onChange,
}: {
  locations: PickerLocation[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  // sproti dodane lokacije, dokler strežnik ne osveži seznama
  const [added, setAdded] = useState<PickerLocation[]>([]);
  const [newName, setNewName] = useState("");
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const known = new Set(locations.map((l) => l.id));
  const all = [...locations, ...added.filter((l) => !known.has(l.id))];
  const chain = ancestorsOf(all, value);
  const children = childrenOf(all, value);

  const typed = newName.trim().toLowerCase();
  const suggestions = nameSuggestions(all, value).filter((s) =>
    s.toLowerCase().includes(typed)
  );

  const addHere = (name = newName.trim()) => {
    if (!name) return;
    startTransition(async () => {
      const res = await createLocationAction(name, value);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setError(null);
      setNewName("");
      setAdded((a) => [...a, res]);
      onChange(res.id);
    });
  };

  return (
    <div className="space-y-2 rounded-md border border-gray-300 p-2 dark:border-gray-700">
      {/* drobtine = trenutna izbira */}
      <div className="flex flex-wrap items-center gap-1 text-sm">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={clsx(
            "rounded px-1.5 py-0.5",
            value === null
              ? "font-semibold text-gray-900 dark:text-gray-100"
              : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          )}
        >
          Hiša
        </button>
        {chain.map((loc, i) => (
          <span key={loc.id} className="flex items-center gap-1">
            <IconChevronRight className="h-3 w-3 text-gray-400" />
            <button
              type="button"
              onClick={() => onChange(loc.id)}
              className={clsx(
                "rounded px-1.5 py-0.5",
                i === chain.length - 1
                  ? "bg-emerald-100 font-semibold text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100"
                  : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              )}
            >
              {loc.name}
            </button>
          </span>
        ))}
      </div>

      {children.length > 0 && (
        <ul className="max-h-48 space-y-0.5 overflow-y-auto">
          {children.map((loc) => (
            <li key={loc.id}>
              <button
                type="button"
                onClick={() => onChange(loc.id)}
                className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <span className="truncate">{loc.name}</span>
                <IconChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addHere();
            }
          }}
          placeholder={value === null ? "Nova soba …" : "Novo mesto tukaj …"}
          className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        />
        <button
          type="button"
          onClick={() => addHere()}
          disabled={pending || !newName.trim()}
          aria-label="Dodaj lokacijo"
          className="flex-shrink-0 rounded-md border border-gray-300 px-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <IconPlus />
        </button>
      </div>
      {focused && suggestions.length > 0 && (
        <SuggestionChips
          suggestions={suggestions}
          disabled={pending}
          onPick={(name) => addHere(name)}
        />
      )}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
