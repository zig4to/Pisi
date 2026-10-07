"use client";

import { useState, useTransition } from "react";
import clsx from "@/lib/utils/clsx";
import Button from "@/components/ui/Button";
import { createRoomsAction } from "@/actions/kesiii";
import { IconCheck, IconPlus } from "@/components/ui/icons";

const PRESETS = [
  "Dnevna soba",
  "Kuhinja",
  "Spalnica",
  "Otroška soba",
  "Kopalnica",
  "Predsoba",
  "Delovna soba",
  "Shramba",
  "Klet",
  "Garaža",
  "Podstrešje",
  "Balkon",
];

/** Prvi zagon: naštej sobe v hiši, da jih kasneje samo izbiraš. */
export default function RoomsSetup() {
  const [picked, setPicked] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [extra, setExtra] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggle = (name: string) =>
    setPicked((p) => (p.includes(name) ? p.filter((n) => n !== name) : [...p, name]));

  const addCustom = () => {
    const name = custom.trim();
    if (!name) return;
    if (!extra.includes(name) && !PRESETS.includes(name)) setExtra((e) => [...e, name]);
    if (!picked.includes(name)) setPicked((p) => [...p, name]);
    setCustom("");
  };

  return (
    <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900 dark:bg-emerald-950/40">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Katere sobe ima tvoja hiša?
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Izberi sobe, pozneje pa v njih dodajaš omare, police in škatle. Vse lahko kasneje urediš.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[...PRESETS, ...extra].map((name) => {
          const on = picked.includes(name);
          return (
            <button
              key={name}
              type="button"
              onClick={() => toggle(name)}
              className={clsx(
                "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm",
                on
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              )}
            >
              {on && <IconCheck className="h-3.5 w-3.5" />}
              {name}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Druga soba …"
          className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        />
        <Button type="button" variant="secondary" onClick={addCustom} aria-label="Dodaj sobo">
          <IconPlus />
        </Button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <Button
        type="button"
        disabled={pending || picked.length === 0}
        onClick={() =>
          startTransition(async () => {
            const res = await createRoomsAction(picked);
            if (res.error) setError(res.error);
          })
        }
        className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 dark:disabled:bg-emerald-900"
      >
        {pending ? "Shranjujem …" : `Shrani sobe (${picked.length})`}
      </Button>
    </div>
  );
}
