"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import clsx from "@/lib/utils/clsx";
import type { Tag } from "@/lib/types/database.types";
import { ColorDot } from "@/components/ui/Badge";
import { IconPlus, IconX } from "@/components/ui/icons";
import {
  createTagInlineAction,
  setPageTagsAction,
} from "@/actions/tags";

export default function TagPicker({
  pageId,
  allTags,
  initialSelected,
}: {
  pageId: string;
  allTags: Tag[];
  initialSelected: Tag[];
}) {
  const [tags, setTags] = useState<Tag[]>(allTags);
  const [selected, setSelected] = useState<Tag[]>(initialSelected);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(initialSelected);
  }, [initialSelected]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTags(allTags);
  }, [allTags]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const persist = (next: Tag[]) => {
    setSelected(next);
    startTransition(() =>
      setPageTagsAction(
        pageId,
        next.map((t) => t.id)
      )
    );
  };

  const toggle = (tag: Tag) => {
    const has = selected.some((t) => t.id === tag.id);
    persist(has ? selected.filter((t) => t.id !== tag.id) : [...selected, tag]);
  };

  const createAndAdd = async () => {
    const name = query.trim();
    if (!name) return;
    const res = await createTagInlineAction(name);
    if ("error" in res) return;
    const tag: Tag = {
      id: res.id,
      name: res.name,
      color: res.color,
      user_id: "",
      created_at: "",
    };
    setTags((prev) =>
      prev.some((t) => t.id === tag.id) ? prev : [...prev, tag]
    );
    if (!selected.some((t) => t.id === tag.id)) persist([...selected, tag]);
    setQuery("");
  };

  const filtered = tags.filter((t) =>
    t.name.toLowerCase().includes(query.trim().toLowerCase())
  );
  const exactExists = tags.some(
    (t) => t.name.toLowerCase() === query.trim().toLowerCase()
  );

  return (
    <div className="relative flex flex-wrap items-center gap-1.5" ref={rootRef}>
      {selected.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 py-0.5 pl-2 pr-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          <ColorDot color={tag.color} />
          {tag.name}
          <button
            type="button"
            aria-label={`Odstrani značko ${tag.name}`}
            onClick={() => toggle(tag)}
            className="rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700"
          >
            <IconX className="h-3 w-3" />
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-xs font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <IconPlus className="h-3 w-3" />
        Značka
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-md border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:shadow-black/40">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim() && !exactExists) {
                e.preventDefault();
                createAndAdd();
              }
            }}
            placeholder="Išči ali ustvari …"
            className="mb-2 w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          />
          <ul className="max-h-48 space-y-0.5 overflow-y-auto">
            {filtered.map((tag) => {
              const checked = selected.some((t) => t.id === tag.id);
              return (
                <li key={tag.id}>
                  <button
                    type="button"
                    onClick={() => toggle(tag)}
                    className={clsx(
                      "flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm",
                      checked
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    )}
                  >
                    <ColorDot color={tag.color} />
                    <span className="flex-1 truncate">{tag.name}</span>
                    {checked && <span aria-hidden>✓</span>}
                  </button>
                </li>
              );
            })}
            {query.trim() && !exactExists && (
              <li>
                <button
                  type="button"
                  onClick={createAndAdd}
                  className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <IconPlus className="h-3.5 w-3.5" />
                  Ustvari „{query.trim()}“
                </button>
              </li>
            )}
            {filtered.length === 0 && !query.trim() && (
              <li className="px-2 py-1 text-xs text-gray-400">Ni značk</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
