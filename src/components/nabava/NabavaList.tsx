"use client";

import { useState, useTransition, type MouseEvent } from "react";
import clsx from "@/lib/utils/clsx";
import type { NabavaCategory, NabavaItem } from "@/lib/types/database.types";
import {
  clearBoughtAction,
  deleteCategoryAction,
  renameCategoryAction,
  setBoughtAction,
} from "@/actions/nabava";
import Button from "@/components/ui/Button";
import Menu, { MenuItem } from "@/components/ui/Menu";
import PromptDialog from "@/components/ui/PromptDialog";
import NabavaItemDialog from "@/components/nabava/NabavaItemDialog";
import {
  IconChevronDown,
  IconChevronRight,
  IconExternalLink,
  IconPlus,
} from "@/components/ui/icons";

type Dialog =
  | { kind: "new"; categoryId: string | null }
  | { kind: "edit"; item: NabavaItem }
  | null;

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "sl");
// nujni najprej, nato po imenu
const byPriority = (a: NabavaItem, b: NabavaItem) =>
  a.priority === b.priority ? byName(a, b) : a.priority === "urgent" ? -1 : 1;

const CHIP = "rounded-full border px-2.5 py-0.5 text-xs";
const CHIP_ON = "border-amber-500 bg-amber-500 text-white";
const CHIP_OFF =
  "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800";

export default function NabavaList({
  categories,
  items,
}: {
  categories: NabavaCategory[];
  items: NabavaItem[];
}) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [rename, setRename] = useState<NabavaCategory | null>(null);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [store, setStore] = useState<string | null>(null);
  const [showBought, setShowBought] = useState(false);
  // takoj skrij odkljukane, preden strežnik osveži seznam
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const isBought = (i: NabavaItem) => toggled[i.id] ?? i.bought_at !== null;
  const open = items.filter((i) => !isBought(i));
  const bought = items.filter(isBought).sort(byName);
  const stores = [...new Set(items.map((i) => i.store).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "sl")
  );
  const filtering = urgentOnly || store !== null;
  const visible = open.filter(
    (i) => (!urgentOnly || i.priority === "urgent") && (store === null || i.store === store)
  );

  const groups = [
    ...[...categories].sort(byName).map((c) => ({ category: c as NabavaCategory | null, id: c.id })),
    { category: null, id: null as string | null },
  ]
    .map((g) => ({
      ...g,
      items: visible.filter((i) => i.category_id === g.id).sort(byPriority),
    }))
    // prazne kategorije pokaži samo brez filtra; „Brez kategorije“ samo, če ni prazna
    .filter((g) => g.items.length > 0 || (g.category !== null && !filtering));

  const toggle = (item: NabavaItem, value: boolean) => {
    setToggled((t) => ({ ...t, [item.id]: value }));
    startTransition(async () => {
      const res = await setBoughtAction(item.id, value);
      if (res.error) {
        setError(res.error);
        setToggled((t) => ({ ...t, [item.id]: !value }));
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {open.length === 0 ? "Vse je kupljeno." : `Še ${open.length} za kupit`}
        </p>
        <Button
          onClick={() => setDialog({ kind: "new", categoryId: null })}
          className="bg-amber-500 hover:bg-amber-600"
        >
          <IconPlus />
          Dodaj
        </Button>
      </div>

      {(open.some((i) => i.priority === "urgent") || stores.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              setUrgentOnly(false);
              setStore(null);
            }}
            className={clsx(CHIP, !filtering ? CHIP_ON : CHIP_OFF)}
          >
            Vse
          </button>
          <button
            type="button"
            onClick={() => setUrgentOnly((v) => !v)}
            className={clsx(
              CHIP,
              urgentOnly ? "border-red-600 bg-red-600 text-white" : CHIP_OFF
            )}
          >
            Nujno
          </button>
          {stores.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStore((cur) => (cur === s ? null : s))}
              className={clsx(CHIP, store === s ? CHIP_ON : CHIP_OFF)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {groups.length === 0 && (
        <p className="py-6 text-center text-sm text-gray-400">
          {filtering ? "Ni izdelkov za ta filter." : "Seznam je prazen. Dodaj prvi izdelek z gumbom Dodaj."}
        </p>
      )}

      {groups.map((g) => (
        <section key={g.id ?? "none"} className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {g.category?.name ?? "Brez kategorije"}
              <span className="ml-1.5 font-normal text-gray-400">{g.items.length}</span>
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Dodaj v to kategorijo"
                onClick={() => setDialog({ kind: "new", categoryId: g.id })}
                className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              >
                <IconPlus />
              </button>
              {g.category && (
                <Menu>
                  {(close) => (
                    <>
                      <MenuItem
                        onClick={() => {
                          close();
                          setRename(g.category);
                        }}
                      >
                        Preimenuj
                      </MenuItem>
                      <MenuItem
                        danger
                        onClick={() => {
                          close();
                          const c = g.category!;
                          if (
                            !confirm(
                              `Izbrišem kategorijo „${c.name}“? Izdelki ostanejo pod „Brez kategorije“.`
                            )
                          )
                            return;
                          startTransition(async () => {
                            const res = await deleteCategoryAction(c.id);
                            if (res.error) setError(res.error);
                          });
                        }}
                      >
                        Izbriši
                      </MenuItem>
                    </>
                  )}
                </Menu>
              )}
            </div>
          </div>

          {g.items.length === 0 ? (
            <p className="text-xs text-gray-400">Prazno.</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
              {g.items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onToggle={(v) => toggle(item, v)}
                  onEdit={() => setDialog({ kind: "edit", item })}
                />
              ))}
            </ul>
          )}
        </section>
      ))}

      {bought.length > 0 && (
        <section className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowBought((v) => !v)}
              className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showBought ? <IconChevronDown /> : <IconChevronRight />}
              Kupljeno ({bought.length})
            </button>
            {showBought && (
              <Button
                variant="ghost"
                className="text-xs"
                onClick={() => {
                  if (!confirm(`Izbrišem vseh ${bought.length} kupljenih izdelkov?`)) return;
                  startTransition(async () => {
                    const res = await clearBoughtAction();
                    if (res.error) setError(res.error);
                  });
                }}
              >
                Počisti kupljeno
              </Button>
            )}
          </div>
          {showBought && (
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white opacity-70 dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
              {bought.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  bought
                  onToggle={(v) => toggle(item, v)}
                  onEdit={() => setDialog({ kind: "edit", item })}
                />
              ))}
            </ul>
          )}
        </section>
      )}

      {dialog && (
        <NabavaItemDialog
          onClose={() => setDialog(null)}
          item={dialog.kind === "edit" ? dialog.item : undefined}
          categoryId={dialog.kind === "new" ? dialog.categoryId : undefined}
          categories={categories}
          stores={stores}
        />
      )}

      <PromptDialog
        open={rename !== null}
        onClose={() => setRename(null)}
        title="Preimenuj kategorijo"
        label="Ime kategorije"
        initialValue={rename?.name ?? ""}
        onSubmit={async (value) => {
          if (rename) return renameCategoryAction(rename.id, value);
        }}
      />
    </div>
  );
}

function ItemRow({
  item,
  bought,
  onToggle,
  onEdit,
}: {
  item: NabavaItem;
  bought?: boolean;
  onToggle: (bought: boolean) => void;
  onEdit: () => void;
}) {
  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <input
        type="checkbox"
        checked={!!bought}
        onChange={(e) => onToggle(e.target.checked)}
        aria-label={bought ? "Vrni na seznam" : "Označi kot kupljeno"}
        className="h-5 w-5 flex-shrink-0 accent-amber-500"
      />
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <span
          className={clsx(
            "block truncate text-sm font-medium text-gray-900 dark:text-gray-100",
            bought && "line-through"
          )}
        >
          {item.name}
        </span>
        {(item.store || item.priority === "urgent") && (
          <span className="mt-0.5 flex items-center gap-1.5 text-xs">
            {item.priority === "urgent" && !bought && (
              <span className="rounded bg-red-100 px-1.5 font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                Nujno
              </span>
            )}
            {item.store && (
              <span className="truncate text-gray-500 dark:text-gray-400">{item.store}</span>
            )}
          </span>
        )}
      </button>
      {item.urls.length === 1 && (
        <a
          href={item.urls[0]}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => openPreview(e, item.urls[0])}
          aria-label="Odpri link"
          title={item.urls[0]}
          className="flex-shrink-0 rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-amber-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-amber-400"
        >
          <IconExternalLink />
        </a>
      )}
      {item.urls.length > 1 && (
        <Menu
          label={`Linki (${item.urls.length})`}
          className="flex-shrink-0"
          trigger={
            <span className="flex items-center gap-0.5 p-0.5">
              <IconExternalLink />
              <span className="text-xs font-medium">{item.urls.length}</span>
            </span>
          }
        >
          {(close) =>
            item.urls.map((u) => (
              <a
                key={u}
                href={u}
                target="_blank"
                rel="noopener noreferrer"
                title={u}
                onClick={(e) => {
                  openPreview(e, u);
                  close();
                }}
                className="flex w-full max-w-64 items-center gap-2 rounded px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <IconExternalLink className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{linkLabel(u)}</span>
              </a>
            ))
          }
        </Menu>
      )}
    </li>
  );
}

// Predogled linka v manjšem ločenem oknu (vedno istem). Telefoni ga odprejo
// kot nov zavihek; s Ctrl/Shift/srednjim klikom ostane običajen zavihek.
function openPreview(e: MouseEvent, url: string) {
  if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
  const w = 720;
  const h = 560;
  // ob levem robu trenutnega okna, da ne prekrije seznama
  const left = Math.round(window.screenX + 24);
  const top = Math.round(window.screenY + (window.outerHeight - h) / 2);
  e.preventDefault();
  // brez „noopener“, ker bi sicer vsak klik odprl novo okno namesto istega
  const win = window.open(url, "nabava-predogled", `popup,width=${w},height=${h},left=${left},top=${top}`);
  if (win) {
    win.opener = null;
    win.focus();
  }
}

/** „https://www.merkur.si/izdelek/123“ -> „merkur.si/izdelek/123“ */
function linkLabel(url: string) {
  try {
    const u = new URL(url);
    const path = u.pathname === "/" ? "" : u.pathname;
    return u.hostname.replace(/^www\./, "") + path;
  } catch {
    return url;
  }
}
