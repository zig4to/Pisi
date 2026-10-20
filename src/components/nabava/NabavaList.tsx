"use client";

import { useState, useTransition, type MouseEvent } from "react";
import Link from "next/link";
import clsx from "@/lib/utils/clsx";
import { projectColor } from "@/lib/utils/color";
import type { NabavaCategory, NabavaItem } from "@/lib/types/database.types";
import type { NabavaProject } from "@/lib/data/nabava";
import {
  addItemToVzletAction,
  clearBoughtAction,
  deleteCategoryAction,
  renameCategoryAction,
  setBoughtAction,
} from "@/actions/nabava";
import Button from "@/components/ui/Button";
import Menu, { MenuItem } from "@/components/ui/Menu";
import PromptDialog from "@/components/ui/PromptDialog";
import NabavaItemDialog, {
  PRIORITY_TABS,
  type Priority,
} from "@/components/nabava/NabavaItemDialog";
import {
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconExternalLink,
  IconPlus,
  IconRocket,
} from "@/components/ui/icons";

type Dialog =
  | { kind: "new"; categoryId: string | null }
  | { kind: "edit"; item: NabavaItem }
  | null;

// „Vse“ levo, nato zavihka po nujnosti
type Tab = Priority | "all";
const TABS: { value: Tab; label: string }[] = [{ value: "all", label: "Vse" }, ...PRIORITY_TABS];

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "sl");


export default function NabavaList({
  categories,
  items,
  projects = [],
  projectId,
  stores: allStores,
}: {
  categories: NabavaCategory[];
  items: NabavaItem[];
  /** za oznako izdelkov, ki pripadajo projektu */
  projects?: NabavaProject[];
  /** seznam znotraj projekta: novi izdelki pripadajo temu projektu, brez oznake projekta */
  projectId?: string;
  /** predlogi trgovin; privzeto trgovine izdelkov na seznamu */
  stores?: string[];
}) {
  const projectOf = (id: string | null) =>
    !projectId && id ? (projects.find((p) => p.id === id) ?? null) : null;
  const [dialog, setDialog] = useState<Dialog>(null);
  const [rename, setRename] = useState<NabavaCategory | null>(null);
  // v projektu so vsi izdelki na enem seznamu
  const [tab, setTab] = useState<Tab>(projectId ? "all" : "urgent");
  const [showBought, setShowBought] = useState(false);
  // takoj skrij odkljukane, preden strežnik osveži seznam
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const isBought = (i: NabavaItem) => toggled[i.id] ?? i.bought_at !== null;
  const inTabOf = (t: Tab) => items.filter((i) => t === "all" || i.priority === t);
  const openCount = (t: Tab) => inTabOf(t).filter((i) => !isBought(i)).length;
  const inTab = inTabOf(tab);
  const open = inTab.filter((i) => !isBought(i));
  const bought = inTab.filter(isBought).sort(byName);
  // „Počisti kupljeno“ izdelkov projektov ne briše (zgodovina projekta)
  const clearable = bought.filter((i) => i.project_id === null);
  // vse trgovine (tudi iz drugega zavihka) — predlogi v obrazcu
  const stores =
    allStores ??
    [...new Set(items.map((i) => i.store).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "sl")
    );

  const groups = [
    ...[...categories].sort(byName).map((c) => ({ category: c as NabavaCategory | null, id: c.id })),
    { category: null, id: null as string | null },
  ]
    .map((g) => ({
      ...g,
      items: open.filter((i) => i.category_id === g.id).sort(byName),
    }))
    // prazne kategorije skrij (ostanejo na voljo v obrazcu izdelka)
    .filter((g) => g.items.length > 0);

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

  // izdelki, ki so bili v tej seji že dodani v Vzlet (kljukica namesto rakete)
  const [sentToVzlet, setSentToVzlet] = useState<Set<string>>(new Set());
  const addToVzlet = (item: NabavaItem) => {
    if (sentToVzlet.has(item.id) && !confirm("Ta izdelek je že v Vzletu. Ga dodam še enkrat?"))
      return;
    setSentToVzlet((s) => new Set(s).add(item.id));
    startTransition(async () => {
      const res = await addItemToVzletAction(item.id);
      setError(res.error ?? null);
      if (res.error)
        setSentToVzlet((s) => {
          const next = new Set(s);
          next.delete(item.id);
          return next;
        });
    });
  };

  return (
    <div className="space-y-4">
      {!projectId && (
        <div className="grid grid-cols-[auto_1fr_1fr] gap-1 rounded-lg bg-gray-200/70 p-1 dark:bg-gray-800">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={tab === t.value}
              onClick={() => setTab(t.value)}
              className={clsx(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                tab === t.value
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-950 dark:text-gray-100"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              )}
            >
              {t.label}
              <span className="ml-1.5 font-normal text-gray-400">{openCount(t.value)}</span>
            </button>
          ))}
        </div>
      )}

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

      {/* ločilna črta: zbledi proti robovoma */}
      <div
        aria-hidden
        className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-700"
      />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {groups.length === 0 && (
        <p className="py-6 text-center text-sm text-gray-400">
          Tu ni ničesar za kupit. Dodaj izdelek z gumbom Dodaj.
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

          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
            {g.items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                project={projectOf(item.project_id)}
                onToggle={(v) => toggle(item, v)}
                onEdit={() => setDialog({ kind: "edit", item })}
                onVzlet={() => addToVzlet(item)}
                inVzlet={sentToVzlet.has(item.id)}
              />
            ))}
          </ul>
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
            {showBought && clearable.length > 0 && (
              <Button
                variant="ghost"
                className="text-xs"
                onClick={() => {
                  if (!confirm(`Izbrišem vseh ${clearable.length} kupljenih izdelkov?`)) return;
                  startTransition(async () => {
                    const res = await clearBoughtAction(tab === "all" ? undefined : tab);
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
                  project={projectOf(item.project_id)}
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
          urgent={tab !== "normal"}
          projectId={projectId}
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
  project,
  bought,
  onToggle,
  onEdit,
  onVzlet,
  inVzlet,
}: {
  item: NabavaItem;
  /** projekt, ki mu izdelek pripada (oznaka) */
  project: NabavaProject | null;
  bought?: boolean;
  onToggle: (bought: boolean) => void;
  onEdit: () => void;
  /** doda „Kupi: …“ med opravila v Vzletu (samo nekupljeni izdelki) */
  onVzlet?: () => void;
  inVzlet?: boolean;
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
        {(item.store || item.price != null) && (
          <span className="mt-0.5 block truncate text-xs text-gray-500 dark:text-gray-400">
            {[item.store, item.price != null && formatPrice(item.price)]
              .filter(Boolean)
              .join(" · ")}
          </span>
        )}
      </button>
      {project && (
        <Link
          href={`/projekti/${project.id}`}
          title={`Projekt: ${project.title}`}
          className="flex max-w-32 flex-shrink-0 items-center gap-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <span
            aria-hidden
            className="h-2 w-2 flex-shrink-0 rounded-full"
            style={{ backgroundColor: projectColor(project) }}
          />
          <span className="truncate">{project.title}</span>
        </Link>
      )}
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
      {onVzlet && (
        <button
          type="button"
          onClick={onVzlet}
          aria-label="Dodaj v Vzlet"
          title={inVzlet ? "Dodano v Vzlet" : `Dodaj v Vzlet: „Kupi: ${item.name}“`}
          className={clsx(
            "flex-shrink-0 rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800",
            inVzlet
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400"
          )}
        >
          {inVzlet ? <IconCheck /> : <IconRocket />}
        </button>
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

/** 12.5 -> „12,50 €“ */
export function formatPrice(value: number) {
  return Number(value).toLocaleString("sl-SI", { style: "currency", currency: "EUR" });
}
