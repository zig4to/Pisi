"use client";

import { useState, useTransition } from "react";
import clsx from "@/lib/utils/clsx";
import type { NabavaCategory, NabavaItem } from "@/lib/types/database.types";
import {
  createCategoryAction,
  createItemAction,
  deleteItemAction,
  updateItemAction,
} from "@/actions/nabava";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import SuggestionChips from "@/components/kesiii/SuggestionChips";
import { IconPlus, IconX } from "@/components/ui/icons";

const AMBER_BTN =
  "bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 dark:disabled:bg-amber-900";

/**
 * Dodajanje ali urejanje izdelka. Starš ga izriše samo, ko je odprt, zato se
 * obrazec ob vsakem odprtju začne na novo.
 */
export default function NabavaItemDialog({
  onClose,
  item,
  categoryId,
  categories,
  stores,
}: {
  onClose: () => void;
  /** obstoječi izdelek = urejanje */
  item?: NabavaItem;
  /** predizbrana kategorija za nov izdelek */
  categoryId?: string | null;
  categories: NabavaCategory[];
  /** že uporabljene trgovine (predlogi) */
  stores: string[];
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [category, setCategory] = useState<string | null>(
    item ? item.category_id : (categoryId ?? null)
  );
  const [store, setStore] = useState(item?.store ?? "");
  // vedno vsaj eno (prazno) polje za link
  const [urls, setUrls] = useState<string[]>(item?.urls.length ? item.urls : [""]);
  const [urgent, setUrgent] = useState(item?.priority === "urgent");
  const [newCategory, setNewCategory] = useState<string | null>(null);
  const [added, setAdded] = useState<{ id: string; name: string }[]>([]);
  const [storeFocused, setStoreFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const known = new Set(categories.map((c) => c.id));
  const allCategories = [...categories, ...added.filter((c) => !known.has(c.id))];
  const typedStore = store.trim().toLowerCase();
  const storeSuggestions = stores.filter(
    (s) => s.toLowerCase().includes(typedStore) && s.toLowerCase() !== typedStore
  );

  const addCategory = () => {
    const value = newCategory?.trim();
    if (!value) return;
    startTransition(async () => {
      const res = await createCategoryAction(value);
      if ("error" in res) return setError(res.error);
      setError(null);
      setAdded((a) => [...a, res]);
      setCategory(res.id);
      setNewCategory(null);
    });
  };

  const submit = () => {
    const input = { name, categoryId: category, store, urls, urgent };
    startTransition(async () => {
      const res = item ? await updateItemAction(item.id, input) : await createItemAction(input);
      if (res.error) return setError(res.error);
      onClose();
    });
  };

  return (
    <Modal open onClose={onClose} title={item ? "Uredi izdelek" : "Kaj je treba kupiti?"}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-4"
      >
        <Field label="Izdelek" htmlFor="nabava-name">
          <Input
            id="nabava-name"
            autoFocus={!item}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="npr. LED luč 12V"
          />
        </Field>

        <div>
          <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Kategorija</p>
          <div className="flex flex-wrap gap-1.5">
            {[{ id: null, name: "Brez" }, ...allCategories].map((c) => (
              <button
                key={c.id ?? "none"}
                type="button"
                onClick={() => setCategory(c.id)}
                className={clsx(
                  "rounded-full border px-2.5 py-0.5 text-sm",
                  category === c.id
                    ? "border-amber-500 bg-amber-500 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                )}
              >
                {c.name}
              </button>
            ))}
            {newCategory === null && (
              <button
                type="button"
                onClick={() => setNewCategory("")}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2.5 py-0.5 text-sm text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <IconPlus className="h-3.5 w-3.5" />
                Nova
              </button>
            )}
          </div>
          {newCategory !== null && (
            <div className="mt-2 flex gap-2">
              <Input
                autoFocus
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCategory();
                  }
                }}
                placeholder="npr. Luči"
              />
              <Button type="button" variant="secondary" onClick={addCategory} disabled={pending}>
                Dodaj
              </Button>
            </div>
          )}
        </div>

        <Field label="Trgovina" htmlFor="nabava-store">
          <Input
            id="nabava-store"
            value={store}
            onChange={(e) => setStore(e.target.value)}
            onFocus={() => setStoreFocused(true)}
            onBlur={() => setStoreFocused(false)}
            placeholder="npr. Merkur, Amazon"
          />
        </Field>
        {storeFocused && storeSuggestions.length > 0 && (
          <div className="-mt-2">
            <SuggestionChips suggestions={storeSuggestions} onPick={setStore} />
          </div>
        )}

        <div>
          <label
            htmlFor="nabava-url-0"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {urls.length > 1 ? "Linki" : "Link"}
          </label>
          <div className="space-y-2">
            {urls.map((u, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  id={`nabava-url-${i}`}
                  inputMode="url"
                  autoCapitalize="off"
                  autoFocus={i > 0 && i === urls.length - 1 && !u}
                  value={u}
                  onChange={(e) =>
                    setUrls((list) => list.map((x, j) => (j === i ? e.target.value : x)))
                  }
                  placeholder="https://…"
                />
                {urls.length > 1 && (
                  <button
                    type="button"
                    aria-label="Odstrani link"
                    onClick={() => setUrls((list) => list.filter((_, j) => j !== i))}
                    className="flex-shrink-0 rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-red-400"
                  >
                    <IconX />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setUrls((list) => [...list, ""])}
            className="mt-2 inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2.5 py-0.5 text-sm text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <IconPlus className="h-3.5 w-3.5" />
            Dodaj link
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={urgent}
            onChange={(e) => setUrgent(e.target.checked)}
            className="h-4 w-4 accent-red-600"
          />
          Nujno
        </label>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex items-center justify-between gap-2">
          {item ? (
            <Button
              type="button"
              variant="ghost"
              className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
              disabled={pending}
              onClick={() => {
                if (!confirm(`Izbrišem „${item.name}“?`)) return;
                startTransition(async () => {
                  const res = await deleteItemAction(item.id);
                  if (res.error) return setError(res.error);
                  onClose();
                });
              }}
            >
              Izbriši
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Prekliči
            </Button>
            <Button type="submit" disabled={pending} className={AMBER_BTN}>
              {pending ? "Shranjujem …" : "Shrani"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
