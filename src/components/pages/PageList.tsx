"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import clsx from "@/lib/utils/clsx";
import { reorder } from "@/lib/utils/dnd";
import type { Notebook, PageListItem, Section } from "@/lib/types/database.types";
import {
  createPageAction,
  movePageAction,
  renamePageAction,
  reorderPagesAction,
  togglePinPageAction,
  trashPageAction,
} from "@/actions/pages";
import Menu, { MenuItem } from "@/components/ui/Menu";
import PromptDialog from "@/components/ui/PromptDialog";
import {
  IconArrowLeft,
  IconChevronRight,
  IconPin,
  IconPlus,
  IconSearch,
  IconX,
} from "@/components/ui/icons";

const OPEN_NOTEBOOK_NAV_EVENT = "pisi:open-notebook-nav";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sl-SI", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const mqMobile = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 767px)").matches;

export default function PageList({
  notebook,
  notebookId,
  sectionId,
  sections,
  pages,
}: {
  notebook: Notebook;
  notebookId: string;
  sectionId: string;
  sections: Section[];
  pages: PageListItem[];
}) {
  const activeSection = sections.find((s) => s.id === sectionId) ?? null;
  const params = useParams<{ pageId?: string }>();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [filter, setFilter] = useState("");
  const [rename, setRename] = useState<{ id: string; value: string } | null>(
    null
  );

  const [order, setOrder] = useState<PageListItem[]>(pages);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrder(pages);
  }, [pages]);

  const drag = useMemo(() => ({ from: -1 }), []);

  // ----- mobilni predal (seznam strani) -----
  // Ob izbiri strani (URL dobi pageId) se seznam pospravi v levo in urejevalnik
  // zasede cel zaslon. Brez izbrane strani je seznam odprt, da lahko izbereš.
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Ob kliku na zavihek (odpre se sekcija brez izbrane strani) se pokaže seznam
  // strani; ko izbereš stran (URL dobi pageId), se seznam zapre in odpre se
  // urejevalnik.
  useEffect(() => {
    if (!mqMobile()) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(!params.pageId);
  }, [params.pageId, sectionId]);

  // Podrsaji (mobilno):
  //  - seznam skrit + podrsaj v desno od levega roba  -> pokaži seznam strani
  //  - seznam odprt + podrsaj v desno                 -> odpri meni beležk
  //  - podrsaj v levo                                 -> skrij seznam strani
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);
  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        touchRef.current = null;
        return;
      }
      touchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };
    const onEnd = (e: TouchEvent) => {
      const start = touchRef.current;
      touchRef.current = null;
      if (!start || !mqMobile()) return;
      // če je odprt zunanji meni (beležke), naj potezo obravnava on
      if (document.documentElement.dataset.notebookNavOpen === "true") return;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;

      if (dx > 0) {
        if (openRef.current) {
          // seznam strani je odprt -> pojdi na meni beležk
          setOpen(false);
          window.dispatchEvent(new Event(OPEN_NOTEBOOK_NAV_EVENT));
        } else if (start.x <= 40) {
          setOpen(true);
        }
      } else if (dx < 0) {
        setOpen(false);
      }
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, []);

  const visible = order.filter((p) =>
    p.title.toLowerCase().includes(filter.trim().toLowerCase())
  );

  return (
    <>
      {/* zatemnitev za mobilni predal */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={clsx(
          "fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 ease-out md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* jeziček za ponovno odpiranje (mobilno, ko je predal skrit) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Pokaži strani"
        className={clsx(
          "fixed left-0 top-1/2 z-20 -translate-y-1/2 rounded-r-md border border-l-0 border-gray-300 bg-white py-4 pl-0.5 pr-1 text-gray-500 shadow-md transition-opacity dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 md:hidden",
          open ? "pointer-events-none opacity-0" : "opacity-100"
        )}
      >
        <IconChevronRight className="h-4 w-4" />
      </button>

      {/* seznam strani: na mobilnem drseči predal, na namizju statični stolpec */}
      <div
        style={
          isMobile
            ? { transform: open ? "translateX(0)" : "translateX(-100%)" }
            : undefined
        }
        className={clsx(
          "flex flex-col border-r border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900",
          "fixed inset-y-0 left-0 z-40 w-[82%] max-w-xs shadow-xl transition-transform duration-300 ease-out will-change-transform",
          "md:static md:z-auto md:w-64 md:max-w-none md:flex-shrink-0 md:shadow-none md:transition-none"
        )}
      >
        <div className="flex items-center justify-between px-2 pt-2 md:hidden">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Strani
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                window.dispatchEvent(new Event(OPEN_NOTEBOOK_NAV_EVENT));
              }}
              aria-label="Nazaj na beležke"
              className="flex items-center gap-1 rounded p-1 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <IconArrowLeft />
              <span className="text-xs font-medium">Beležke</span>
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Skrij strani"
              className="rounded p-1 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <IconX />
            </button>
          </div>
        </div>

        {/* pot: Beležka / Sekcija — beležka je označena s svojo barvo */}
        <div
          className="flex items-center gap-1.5 overflow-hidden border-b border-gray-200 px-3 py-2 dark:border-gray-800"
          style={{ borderLeft: `3px solid ${notebook.color}` }}
        >
          <span
            className="h-2.5 w-2.5 flex-shrink-0 rounded-[4px]"
            style={{ backgroundColor: notebook.color }}
          />
          <span
            className="max-w-[45%] flex-shrink-0 truncate text-xs font-semibold"
            style={{ color: notebook.color }}
            title={notebook.title}
          >
            {notebook.title}
          </span>
          {activeSection && (
            <>
              <span className="flex-shrink-0 text-xs text-gray-400">/</span>
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: activeSection.color }}
              />
              <span
                className="truncate text-xs font-medium text-gray-600 dark:text-gray-300"
                title={activeSection.title}
              >
                {activeSection.title}
              </span>
            </>
          )}
        </div>

        <div className="space-y-2 p-2">
          <button
            type="button"
            onClick={() =>
              startTransition(() => createPageAction(notebookId, sectionId))
            }
            className="flex w-full items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <IconPlus />
            Nova stran
          </button>
          <div className="flex items-center gap-2 rounded-md border border-gray-300 px-2 py-1.5 dark:border-gray-700">
            <IconSearch className="h-4 w-4 flex-shrink-0 text-gray-400" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtriraj strani …"
              className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
            />
          </div>
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {visible.length === 0 && (
            <li className="px-2 py-4 text-center text-xs text-gray-400">
              {order.length === 0 ? "Ni strani" : "Ni zadetkov"}
            </li>
          )}
          {visible.map((page) => {
            const active = params.pageId === page.id;
            const idx = order.findIndex((p) => p.id === page.id);
            return (
              <li
                key={page.id}
                draggable
                onDragStart={() => (drag.from = idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (drag.from < 0 || drag.from === idx) return;
                  const next = reorder(order, drag.from, idx);
                  setOrder(next);
                  drag.from = -1;
                  startTransition(() =>
                    reorderPagesAction(next.map((p) => p.id))
                  );
                }}
                className={clsx(
                  "group flex items-center gap-1 rounded-md px-1 py-0.5",
                  active
                    ? "bg-blue-100 dark:bg-blue-950"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <Link
                  href={`/belezke/${notebookId}/${sectionId}/${page.id}`}
                  onClick={() => {
                    if (mqMobile()) setOpen(false);
                  }}
                  className="flex min-w-0 flex-1 flex-col px-2 py-1.5"
                >
                  <span
                    className={clsx(
                      "flex items-center gap-1.5 truncate text-[15px]",
                      active
                        ? "font-semibold text-blue-800 dark:text-blue-200"
                        : "text-gray-800 dark:text-gray-200"
                    )}
                  >
                    {page.is_pinned && (
                      <IconPin className="h-3 w-3 flex-shrink-0 text-gray-400" />
                    )}
                    <span className="truncate">{page.title}</span>
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(page.updated_at)}
                  </span>
                </Link>
                <Menu>
                  {(close) => (
                    <>
                      <MenuItem
                        onClick={() => {
                          close();
                          setRename({ id: page.id, value: page.title });
                        }}
                      >
                        Preimenuj
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          close();
                          startTransition(() =>
                            togglePinPageAction(page.id, !page.is_pinned)
                          );
                        }}
                      >
                        {page.is_pinned ? "Odpni" : "Pripni"}
                      </MenuItem>
                      <a
                        href={`/belezke/${notebookId}/${sectionId}/${page.id}/izvozi`}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                        onClick={() => close()}
                      >
                        Izvozi v Markdown
                      </a>
                      {sections.length > 1 && (
                        <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                      )}
                      {sections
                        .filter((s) => s.id !== sectionId)
                        .map((s) => (
                          <MenuItem
                            key={s.id}
                            onClick={() => {
                              close();
                              startTransition(async () => {
                                await movePageAction(page.id, s.id);
                                router.push(`/belezke/${notebookId}/${s.id}`);
                              });
                            }}
                          >
                            Premakni v: {s.title}
                          </MenuItem>
                        ))}
                      <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                      <MenuItem
                        danger
                        onClick={() => {
                          close();
                          if (
                            confirm(`Premaknem stran "${page.title}" v koš?`)
                          ) {
                            startTransition(() =>
                              trashPageAction(page.id, notebookId, sectionId)
                            );
                          }
                        }}
                      >
                        Premakni v koš
                      </MenuItem>
                    </>
                  )}
                </Menu>
              </li>
            );
          })}
        </ul>
      </div>

      <PromptDialog
        open={rename !== null}
        onClose={() => setRename(null)}
        title="Preimenuj stran"
        label="Naslov strani"
        initialValue={rename?.value ?? ""}
        onSubmit={async (value) => {
          if (rename) await renamePageAction(rename.id, value);
        }}
      />
    </>
  );
}
