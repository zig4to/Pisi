"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation";
import clsx from "@/lib/utils/clsx";
import { reorder } from "@/lib/utils/dnd";
import type { NotebookWithSections } from "@/lib/types/database.types";
import { logoutAction } from "@/actions/auth";
import {
  createNotebookAction,
  renameNotebookAction,
  reorderNotebooksAction,
  togglePinNotebookAction,
  trashNotebookAction,
} from "@/actions/notebooks";
import {
  createSectionAction,
  renameSectionAction,
  reorderSectionsAction,
  togglePinSectionAction,
  trashSectionAction,
} from "@/actions/sections";
import { ColorDot } from "@/components/ui/Badge";
import Menu, { MenuItem } from "@/components/ui/Menu";
import PromptDialog from "@/components/ui/PromptDialog";
import {
  IconBook,
  IconChevronDown,
  IconChevronRight,
  IconHome,
  IconLogout,
  IconPin,
  IconPlus,
  IconSearch,
  IconSettings,
  IconTag,
  IconTrash,
  IconX,
} from "@/components/ui/icons";

type DialogState =
  | { kind: "new-notebook" }
  | { kind: "rename-notebook"; id: string; value: string }
  | { kind: "new-section"; notebookId: string }
  | { kind: "rename-section"; id: string; value: string }
  | null;

export default function Sidebar({
  tree,
  userEmail,
}: {
  tree: NotebookWithSections[];
  userEmail: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams<{ notebookId?: string; sectionId?: string }>();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  // Lokalni vrstni red za drag & drop (sinhroniziran s strežniškim `tree`).
  const [order, setOrder] = useState<NotebookWithSections[]>(tree);
  useEffect(() => {
    // Reset lokalnega stanja ob spremembi strežniških podatkov.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrder(tree);
  }, [tree]);

  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(params.notebookId ? [params.notebookId] : [])
  );
  useEffect(() => {
    if (!params.notebookId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpanded((prev) => new Set(prev).add(params.notebookId!));
  }, [params.notebookId]);

  // zapri predal ob navigaciji (mobilno) — ob odprtju nove strani se
  // stranska vrstica pospravi v levo
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [pathname]);

  // gumb "nazaj na beležke" v seznamu strani odpre ta meni
  useEffect(() => {
    const open = () => setMobileOpen(true);
    window.addEventListener("pisi:open-notebook-nav", open);
    return () => window.removeEventListener("pisi:open-notebook-nav", open);
  }, []);

  // Zunanji meni (beležke) se na mobilnem odpre z gumbom (hamburger); s
  // podrsajem v levo pa ga zapremo. Podrsaj v desno je rezerviran za seznam
  // strani (glej PageList). Sporočimo stanje prek atributa na <html>, da se
  // poteze obeh predalov ne prekrivajo.
  useEffect(() => {
    document.documentElement.dataset.notebookNavOpen = mobileOpen
      ? "true"
      : "false";
  }, [mobileOpen]);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const isMobile = () => window.matchMedia("(max-width: 767px)").matches;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        touchStartRef.current = null;
        return;
      }
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const onEnd = (e: TouchEvent) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start || !isMobile()) return;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;

      // upoštevaj le izrazito vodoravne poteze v levo, ko je meni odprt
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0) setMobileOpen(false);
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, []);

  const dragNotebook = useMemo(() => ({ from: -1 }), []);
  const dragSection = useMemo(() => ({ notebookId: "", from: -1 }), []);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    if (q.length >= 2) router.push(`/iskanje?q=${encodeURIComponent(q)}`);
  };

  const bottomLinks = [
    { href: "/iskanje", label: "Iskanje", icon: <IconSearch /> },
    { href: "/znacke", label: "Značke", icon: <IconTag /> },
    { href: "/kos", label: "Koš", icon: <IconTrash /> },
    { href: "/nastavitve", label: "Nastavitve", icon: <IconSettings /> },
  ];

  const body = (
    <div className="flex h-full w-72 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* glava */}
      <div className="flex items-center justify-between px-3 py-3">
        <Link href="/" className="flex items-center gap-2">
          <IconBook className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Pisi
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Zapri meni"
          >
            <IconX />
          </button>
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Domov"
            title="Domov"
          >
            <IconHome />
          </Link>
        </div>
      </div>

      {/* iskanje */}
      <form onSubmit={submitSearch} className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-md border border-gray-300 px-2 py-1.5 dark:border-gray-700">
          <IconSearch className="h-4 w-4 flex-shrink-0 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Išči po straneh …"
            className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
          />
        </div>
      </form>

      {/* nova beležka */}
      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={() => setDialog({ kind: "new-notebook" })}
          className="flex w-full items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <IconPlus />
          Nova beležka
        </button>
      </div>

      {/* drevo */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {order.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-gray-400">
            Ni beležk. Ustvari prvo.
          </p>
        )}
        <ul className="space-y-0.5">
          {order.map((nb, nbIndex) => {
            const isOpen = expanded.has(nb.id);
            const nbActive = params.notebookId === nb.id;
            return (
              <li
                key={nb.id}
                draggable
                onDragStart={() => (dragNotebook.from = nbIndex)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragNotebook.from < 0 || dragNotebook.from === nbIndex)
                    return;
                  const next = reorder(order, dragNotebook.from, nbIndex);
                  setOrder(next);
                  dragNotebook.from = -1;
                  startTransition(() =>
                    reorderNotebooksAction(next.map((n) => n.id))
                  );
                }}
              >
                <div
                  className={clsx(
                    "group flex items-center gap-1 rounded-md px-1.5 py-1.5",
                    nbActive
                      ? "bg-blue-50 dark:bg-blue-950"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(nb.id)}
                    className="rounded p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    aria-label={isOpen ? "Skrči" : "Razširi"}
                  >
                    {isOpen ? <IconChevronDown /> : <IconChevronRight />}
                  </button>
                  <Link
                    href={`/belezke/${nb.id}`}
                    className="flex min-w-0 flex-1 items-center gap-2"
                  >
                    <ColorDot color={nb.color} />
                    <span
                      className={clsx(
                        "truncate text-base",
                        nbActive
                          ? "font-semibold text-blue-700 dark:text-blue-300"
                          : "text-gray-800 dark:text-gray-200"
                      )}
                    >
                      {nb.title}
                    </span>
                    {nb.is_pinned && (
                      <IconPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                    )}
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      setDialog({ kind: "new-section", notebookId: nb.id })
                    }
                    className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    aria-label="Nova sekcija"
                    title="Nova sekcija"
                  >
                    <IconPlus />
                  </button>
                  <Menu>
                    {(close) => (
                      <>
                        <MenuItem
                          onClick={() => {
                            close();
                            setDialog({
                              kind: "rename-notebook",
                              id: nb.id,
                              value: nb.title,
                            });
                          }}
                        >
                          Preimenuj
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            close();
                            startTransition(() =>
                              togglePinNotebookAction(nb.id, !nb.is_pinned)
                            );
                          }}
                        >
                          {nb.is_pinned ? "Odpni" : "Pripni"}
                        </MenuItem>
                        <MenuItem
                          danger
                          onClick={() => {
                            close();
                            if (
                              confirm(
                                `Premaknem beležko "${nb.title}" v koš? Skupaj z njo bodo skrite vse sekcije in strani.`
                              )
                            ) {
                              startTransition(() => trashNotebookAction(nb.id));
                            }
                          }}
                        >
                          Premakni v koš
                        </MenuItem>
                      </>
                    )}
                  </Menu>
                </div>

                {isOpen && (
                  <ul className="ml-6 mt-0.5 space-y-0.5 border-l border-gray-200 pl-2 dark:border-gray-800">
                    {nb.sections.length === 0 && (
                      <li className="px-2 py-1 text-xs text-gray-400">
                        Ni sekcij
                      </li>
                    )}
                    {nb.sections.map((sec, secIndex) => {
                      const secActive = params.sectionId === sec.id;
                      return (
                        <li
                          key={sec.id}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            dragSection.notebookId = nb.id;
                            dragSection.from = secIndex;
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.stopPropagation();
                            if (
                              dragSection.notebookId !== nb.id ||
                              dragSection.from < 0 ||
                              dragSection.from === secIndex
                            )
                              return;
                            const next = reorder(
                              nb.sections,
                              dragSection.from,
                              secIndex
                            );
                            setOrder((prev) =>
                              prev.map((n) =>
                                n.id === nb.id ? { ...n, sections: next } : n
                              )
                            );
                            dragSection.from = -1;
                            startTransition(() =>
                              reorderSectionsAction(next.map((s) => s.id))
                            );
                          }}
                          className={clsx(
                            "group flex items-center gap-1.5 rounded-md px-1.5 py-1",
                            secActive
                              ? "bg-blue-50 dark:bg-blue-950"
                              : "hover:bg-gray-100 dark:hover:bg-gray-800"
                          )}
                        >
                          <Link
                            href={`/belezke/${nb.id}/${sec.id}`}
                            className="flex min-w-0 flex-1 items-center gap-2"
                          >
                            <ColorDot color={sec.color} />
                            <span
                              className={clsx(
                                "truncate text-[15px]",
                                secActive
                                  ? "font-medium text-blue-700 dark:text-blue-300"
                                  : "text-gray-700 dark:text-gray-300"
                              )}
                            >
                              {sec.title}
                            </span>
                            {sec.is_pinned && (
                              <IconPin className="h-3 w-3 flex-shrink-0 text-gray-400" />
                            )}
                          </Link>
                          <Menu>
                            {(close) => (
                              <>
                                <MenuItem
                                  onClick={() => {
                                    close();
                                    setDialog({
                                      kind: "rename-section",
                                      id: sec.id,
                                      value: sec.title,
                                    });
                                  }}
                                >
                                  Preimenuj
                                </MenuItem>
                                <MenuItem
                                  onClick={() => {
                                    close();
                                    startTransition(() =>
                                      togglePinSectionAction(
                                        sec.id,
                                        !sec.is_pinned
                                      )
                                    );
                                  }}
                                >
                                  {sec.is_pinned ? "Odpni" : "Pripni"}
                                </MenuItem>
                                <MenuItem
                                  danger
                                  onClick={() => {
                                    close();
                                    if (
                                      confirm(
                                        `Premaknem sekcijo "${sec.title}" v koš?`
                                      )
                                    ) {
                                      startTransition(() =>
                                        trashSectionAction(sec.id, nb.id)
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
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* spodnje povezave */}
      <div className="border-t border-gray-200 px-2 py-2 dark:border-gray-800">
        {bottomLinks.map((l) => {
          const active =
            l.href === "/iskanje"
              ? pathname === "/iskanje"
              : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium",
                active
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              )}
            >
              {l.icon}
              {l.label}
            </Link>
          );
        })}
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-200 px-2 pt-2 dark:border-gray-800">
          <span
            className="min-w-0 truncate text-xs text-gray-500 dark:text-gray-400"
            title={userEmail ?? undefined}
          >
            {userEmail}
          </span>
          <form action={logoutAction}>
            <button
              type="submit"
              aria-label="Odjava"
              className="flex items-center gap-1 rounded p-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <IconLogout />
              Odjava
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* mobilni gumbi — desno zgoraj, navpično poravnani na sredino vrstice (min-h-12) */}
      <div className="fixed right-3 top-0 z-20 flex h-12 items-center gap-2 md:hidden">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          aria-label="Domov"
          title="Domov"
          className="rounded-md border border-gray-300 bg-white p-2 text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          <IconHome />
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Odpri beležke"
          className="rounded-md border border-gray-300 bg-white p-2 text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          <IconBook />
        </button>
      </div>

      {/* desktop */}
      <div className="hidden md:block">{body}</div>

      {/* mobilni predal — vedno v DOM-u, drsi z leve strani */}
      <div
        className={clsx(
          "fixed inset-0 z-50 md:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          className={clsx(
            "absolute inset-0 bg-black/40 transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileOpen(false)}
        />
        <div
          style={{
            transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          }}
          className="absolute left-0 top-0 h-full shadow-xl transition-transform duration-300 ease-out will-change-transform"
        >
          {body}
        </div>
      </div>

      {/* dialogi */}
      <PromptDialog
        open={dialog?.kind === "new-notebook"}
        onClose={() => setDialog(null)}
        title="Nova beležka"
        label="Ime beležke"
        submitLabel="Ustvari"
        onSubmit={async (value) => {
          const fd = new FormData();
          fd.set("title", value);
          return createNotebookAction({}, fd);
        }}
      />
      <PromptDialog
        open={dialog?.kind === "rename-notebook"}
        onClose={() => setDialog(null)}
        title="Preimenuj beležko"
        label="Ime beležke"
        initialValue={dialog?.kind === "rename-notebook" ? dialog.value : ""}
        onSubmit={async (value) => {
          if (dialog?.kind === "rename-notebook")
            await renameNotebookAction(dialog.id, value);
        }}
      />
      <PromptDialog
        open={dialog?.kind === "new-section"}
        onClose={() => setDialog(null)}
        title="Nova sekcija"
        label="Ime sekcije"
        submitLabel="Ustvari"
        onSubmit={async (value) => {
          if (dialog?.kind !== "new-section") return;
          const fd = new FormData();
          fd.set("title", value);
          return createSectionAction(dialog.notebookId, {}, fd);
        }}
      />
      <PromptDialog
        open={dialog?.kind === "rename-section"}
        onClose={() => setDialog(null)}
        title="Preimenuj sekcijo"
        label="Ime sekcije"
        initialValue={dialog?.kind === "rename-section" ? dialog.value : ""}
        onSubmit={async (value) => {
          if (dialog?.kind === "rename-section")
            await renameSectionAction(dialog.id, value);
        }}
      />
    </>
  );
}
