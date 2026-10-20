"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { TIME_ZONE } from "@/lib/utils/dates";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "@/lib/utils/clsx";
import { projectColor } from "@/lib/utils/color";
import { reorder } from "@/lib/utils/dnd";
import { imageUrl } from "@/lib/utils/images";
import { uploadImage } from "@/lib/utils/upload";
import type { ProjectDetailData } from "@/lib/data/projekti";
import type { ProjectImage, ProjectStep } from "@/lib/types/database.types";
import {
  addImageAction,
  addStepAction,
  addStepToVzletAction,
  completeProjectAction,
  deleteImageAction,
  deleteProjectAction,
  deleteStepAction,
  renameStepAction,
  reorderStepsAction,
  toggleStepAction,
  updateProjectAction,
} from "@/actions/projekti";
import NabavaList, { formatPrice } from "@/components/nabava/NabavaList";
import { formatDate } from "@/components/projekti/ProjectList";
import Journal from "@/components/projekti/Journal";
import Section from "@/components/projekti/Section";
import { ColorDot } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import Menu, { MenuItem } from "@/components/ui/Menu";
import PromptDialog from "@/components/ui/PromptDialog";
import {
  IconArrowLeft,
  IconCheck,
  IconExternalLink,
  IconImage,
  IconLink,
  IconPlus,
  IconRestore,
  IconRocket,
  IconShoppingCart,
  IconStickyNote,
  IconX,
} from "@/components/ui/icons";

type Panel = "nabava" | "notes" | "links" | "images";

export default function ProjectDetail({
  project,
  entries,
  steps,
  images,
  items,
  categories,
  stores,
}: ProjectDetailData) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  // razdelek, odprt z gumbom na vrhu (prikaže se pod koraki in dnevnikom)
  const [panel, setPanel] = useState<Panel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const done = project.completed_at !== null;

  const cost = items.reduce((sum, i) => sum + (Number(i.price) || 0), 0);
  const boughtCost = items
    .filter((i) => i.bought_at)
    .reduce((sum, i) => sum + (Number(i.price) || 0), 0);

  const openItems = items.filter((i) => !i.bought_at).length;
  const panels: { value: Panel; label: string; icon: ReactNode; badge: string | null }[] = [
    {
      value: "nabava",
      label: "Nabava",
      icon: <IconShoppingCart className="h-5 w-5" />,
      badge: openItems > 0 ? String(openItems) : null,
    },
    {
      value: "notes",
      label: "Beležke",
      icon: <IconStickyNote className="h-5 w-5" />,
      badge: project.notes.trim() ? "•" : null,
    },
    {
      value: "links",
      label: "Povezave",
      icon: <IconLink className="h-5 w-5" />,
      badge: project.links.length > 0 ? String(project.links.length) : null,
    },
    {
      value: "images",
      label: "Slike",
      icon: <IconImage className="h-5 w-5" />,
      badge: images.length > 0 ? String(images.length) : null,
    },
  ];

  const run = (action: () => Promise<{ error?: string }>, after?: () => void) =>
    startTransition(async () => {
      const res = await action();
      if (res.error) return setError(res.error);
      setError(null);
      after?.();
    });

  return (
    <div className="space-y-4">
      {/* glava */}
      <div className="space-y-1">
        <div className="-ml-2 flex items-center justify-between gap-1">
          <Link
            href="/projekti"
            aria-label="Nazaj na projekte"
            title="Nazaj na projekte"
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          >
            <IconArrowLeft />
            Nazaj
          </Link>
          <Menu>
            {(close) => (
              <>
                <MenuItem
                  onClick={() => {
                    close();
                    setRenaming(true);
                  }}
                >
                  Preimenuj
                </MenuItem>
                <MenuItem
                  danger
                  onClick={() => {
                    close();
                    if (
                      !confirm(
                        `Izbrišem projekt „${project.title}“? Izbrisani bodo tudi dnevnik, koraki, slike in izdelki za nabavo.`
                      )
                    )
                      return;
                    run(
                      () => deleteProjectAction(project.id),
                      () => router.push("/projekti")
                    );
                  }}
                >
                  Izbriši projekt
                </MenuItem>
              </>
            )}
          </Menu>
        </div>
        <div>
          <h1 className="flex items-baseline gap-2.5 break-words text-2xl font-bold text-gray-900 dark:text-gray-100">
            <ColorDot color={projectColor(project)} className="h-4 w-4 flex-shrink-0 self-center" />
            <span className="min-w-0">{project.title}</span>
          </h1>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Začeto {formatDate(project.created_at)}
            {done && ` · Dokončano ${formatDate(project.completed_at!)}`}
          </p>
        </div>
      </div>

      {done && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          <IconCheck className="h-4 w-4 flex-shrink-0" />
          Projekt je dokončan {formatDate(project.completed_at!)}.
        </div>
      )}

      {/* gumbi za razdelke — ob kliku se razdelek odpre takoj pod gumbi, nad koraki */}
      <div className="grid grid-cols-4 gap-2">
        {panels.map((p) => (
          <button
            key={p.value}
            type="button"
            aria-pressed={panel === p.value}
            onClick={() => setPanel((cur) => (cur === p.value ? null : p.value))}
            className={clsx(
              "relative flex flex-col items-center gap-1 rounded-lg border px-1 py-2.5 text-xs font-medium transition-colors",
              panel === p.value
                ? "border-violet-500 bg-violet-600 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-violet-300 hover:bg-violet-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-violet-800 dark:hover:bg-violet-950/40"
            )}
          >
            {p.icon}
            {p.label}
            {p.badge && (
              <span
                className={clsx(
                  "absolute right-1.5 top-1.5 min-w-4 rounded-full px-1 text-[10px] leading-4",
                  panel === p.value
                    ? "bg-white/25 text-white"
                    : "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                )}
              >
                {p.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {/* razdelki ostanejo v DOM-u (skriti), da beležke ne izgubijo neshranjenega besedila */}
      <div hidden={panel !== "nabava"}>
        <Section
          title="Nabava"
          aside={
            cost > 0
              ? `Skupaj ${formatPrice(cost)} · kupljeno ${formatPrice(boughtCost)}`
              : undefined
          }
        >
          <NabavaList
            categories={categories}
            items={items}
            projectId={project.id}
            stores={stores}
          />
        </Section>
      </div>
      <div hidden={panel !== "notes"}>
        <Notes projectId={project.id} initial={project.notes} onError={setError} />
      </div>
      <div hidden={panel !== "links"}>
        <Links projectId={project.id} links={project.links} onError={setError} />
      </div>
      <div hidden={panel !== "images"}>
        <Images projectId={project.id} images={images} onError={setError} />
      </div>

      <Steps projectId={project.id} steps={steps} onError={setError} />
      <Journal project={project} entries={entries} steps={steps} onError={setError} />

      {/* potrditev dokončanja */}
      <div className="pt-2">
        {done ? (
          <Button
            variant="secondary"
            className="w-full"
            disabled={pending}
            onClick={() => run(() => completeProjectAction(project.id, false))}
          >
            <IconRestore />
            Ponovno odpri projekt
          </Button>
        ) : (
          <Button
            className="w-full bg-emerald-600 py-3 text-base hover:bg-emerald-700 disabled:bg-emerald-300"
            disabled={pending}
            onClick={() => {
              const openSteps = steps.filter((s) => !s.done_at).length;
              const warn = [
                openSteps > 0 && `${openSteps} korakov še ni opravljenih`,
                openItems > 0 && `${openItems} izdelkov še ni kupljenih`,
              ].filter(Boolean);
              const msg =
                `Potrdim, da je projekt „${project.title}“ dokončan?` +
                (warn.length ? `\n\nPozor: ${warn.join(", ")}.` : "");
              if (!confirm(msg)) return;
              run(
                () => completeProjectAction(project.id, true),
                () => router.push("/projekti")
              );
            }}
          >
            <IconCheck className="h-5 w-5" />
            Potrdi dokončanje projekta
          </Button>
        )}
      </div>

      <PromptDialog
        open={renaming}
        onClose={() => setRenaming(false)}
        title="Preimenuj projekt"
        label="Ime projekta"
        initialValue={project.title}
        onSubmit={(value) => updateProjectAction(project.id, { title: value })}
      />
    </div>
  );
}

// ============ Koraki ============

function Steps({
  projectId,
  steps,
  onError,
}: {
  projectId: string;
  steps: ProjectStep[];
  onError: (e: string | null) => void;
}) {
  const [order, setOrder] = useState(steps);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrder(steps);
  }, [steps]);
  const [title, setTitle] = useState("");
  const [rename, setRename] = useState<ProjectStep | null>(null);
  const [, startTransition] = useTransition();
  const drag = useMemo(() => ({ from: -1 }), []);

  const doneCount = order.filter((s) => s.done_at).length;
  const pct = order.length ? Math.round((doneCount / order.length) * 100) : 0;

  const call = (action: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      const res = await action();
      onError(res.error ?? null);
    });

  const add = () => {
    const value = title.trim();
    if (!value) return;
    setTitle("");
    call(() => addStepAction(projectId, value, order.length));
  };

  return (
    <Section title="Koraki" aside={order.length > 0 ? `${doneCount}/${order.length}` : undefined}>
      {order.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-violet-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="w-9 flex-shrink-0 text-right text-xs font-medium tabular-nums text-violet-600 dark:text-violet-400">
            {pct} %
          </span>
        </div>
      )}
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {order.map((step, index) => (
          <li
            key={step.id}
            draggable
            onDragStart={() => (drag.from = index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (drag.from < 0 || drag.from === index) return;
              const next = reorder(order, drag.from, index);
              setOrder(next);
              drag.from = -1;
              call(() => reorderStepsAction(next.map((s) => s.id)));
            }}
            className="flex items-center gap-3 py-2"
          >
            <span className="w-5 flex-shrink-0 text-right text-sm font-medium tabular-nums text-gray-400">
              {index + 1}.
            </span>
            <input
              type="checkbox"
              checked={step.done_at !== null}
              onChange={(e) => {
                const value = e.target.checked;
                setOrder((list) =>
                  list.map((s) =>
                    s.id === step.id ? { ...s, done_at: value ? new Date().toISOString() : null } : s
                  )
                );
                call(() => toggleStepAction(step.id, value));
              }}
              aria-label={step.done_at ? "Označi kot neopravljeno" : "Označi kot opravljeno"}
              className="h-5 w-5 flex-shrink-0 accent-violet-600"
            />
            <span
              className={clsx(
                "min-w-0 flex-1 break-words text-sm text-gray-900 dark:text-gray-100",
                step.done_at && "text-gray-400 line-through dark:text-gray-500"
              )}
            >
              {step.title}
              {step.vzlet_added_at && (
                <span
                  title={`Dodano v Vzlet ${new Date(step.vzlet_added_at).toLocaleDateString("sl-SI", { timeZone: TIME_ZONE })}`}
                  className="ml-2 inline-flex items-center gap-1 rounded-full bg-sky-100 px-1.5 py-0.5 align-middle text-[10px] font-semibold text-sky-700 no-underline dark:bg-sky-950 dark:text-sky-300"
                >
                  <IconRocket className="h-3 w-3" />
                  Vzlet
                </span>
              )}
            </span>
            <Menu>
              {(close) => (
                <>
                  <MenuItem
                    onClick={() => {
                      close();
                      setRename(step);
                    }}
                  >
                    Preimenuj
                  </MenuItem>
                  {!step.done_at && (
                    <MenuItem
                      onClick={() => {
                        close();
                        if (
                          step.vzlet_added_at &&
                          !confirm("Ta korak je že v Vzletu. Ga dodam še enkrat?")
                        )
                          return;
                        call(() => addStepToVzletAction(step.id));
                      }}
                    >
                      Dodaj v Vzlet
                    </MenuItem>
                  )}
                  <MenuItem
                    danger
                    onClick={() => {
                      close();
                      call(() => deleteStepAction(step.id));
                    }}
                  >
                    Izbriši
                  </MenuItem>
                </>
              )}
            </Menu>
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        className="flex gap-2"
      >
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nov korak, npr. Zapri vodo"
        />
        <Button type="submit" variant="secondary" aria-label="Dodaj korak">
          <IconPlus />
        </Button>
      </form>

      <PromptDialog
        open={rename !== null}
        onClose={() => setRename(null)}
        title="Preimenuj korak"
        label="Korak"
        initialValue={rename?.title ?? ""}
        onSubmit={async (value) => {
          if (rename) return renameStepAction(rename.id, value);
        }}
      />
    </Section>
  );
}

// ============ Beležke ============

function Notes({
  projectId,
  initial,
  onError,
}: {
  projectId: string;
  initial: string;
  onError: (e: string | null) => void;
}) {
  const [notes, setNotes] = useState(initial);
  const [status, setStatus] = useState<"" | "saving" | "saved">("");
  const saved = useRef(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = async (value: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (value === saved.current) return;
    setStatus("saving");
    const res = await updateProjectAction(projectId, { notes: value });
    if (res.error) {
      setStatus("");
      return onError(res.error);
    }
    saved.current = value;
    setStatus("saved");
  };

  // samodejno shranjevanje po premoru v tipkanju
  useEffect(() => {
    if (notes === saved.current) return;
    timer.current = setTimeout(() => save(notes), 1000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  return (
    <Section
      title="Beležke"
      aside={status === "saving" ? "Shranjujem …" : status === "saved" ? "Shranjeno" : undefined}
    >
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => save(notes)}
        rows={5}
        placeholder="Mere, ideje, kontakti, karkoli si želiš zapomniti …"
      />
    </Section>
  );
}

// ============ Povezave ============

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

function Links({
  projectId,
  links,
  onError,
}: {
  projectId: string;
  links: string[];
  onError: (e: string | null) => void;
}) {
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();

  const save = (next: string[], after?: () => void) =>
    startTransition(async () => {
      const res = await updateProjectAction(projectId, { links: next });
      onError(res.error ?? null);
      if (!res.error) after?.();
    });

  return (
    <Section title="Povezave">
      {links.length > 0 && (
        <ul className="space-y-1">
          {links.map((url) => (
            <li key={url} className="flex items-center gap-2">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                title={url}
                className="flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-1 text-sm font-medium text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-950/40"
              >
                <IconExternalLink className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{linkLabel(url)}</span>
              </a>
              <button
                type="button"
                aria-label="Odstrani povezavo"
                onClick={() => save(links.filter((l) => l !== url))}
                className="flex-shrink-0 rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-800 dark:hover:text-red-400"
              >
                <IconX />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!value.trim()) return;
          save([...links, value], () => setValue(""));
        }}
        className="flex gap-2"
      >
        <Input
          inputMode="url"
          autoCapitalize="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://… (navodila, video, trgovina)"
        />
        <Button type="submit" variant="secondary" disabled={pending} aria-label="Dodaj povezavo">
          <IconPlus />
        </Button>
      </form>
    </Section>
  );
}

// ============ Slike ============

function Images({
  projectId,
  images,
  onError,
}: {
  projectId: string;
  images: ProjectImage[];
  onError: (e: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState<ProjectImage | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!viewing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewing(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewing]);

  const upload = async (files: File[]) => {
    setBusy(true);
    onError(null);
    try {
      for (const file of files) {
        const { path } = await uploadImage(file, "projekti");
        const res = await addImageAction(projectId, path);
        if (res.error) throw new Error(res.error);
      }
    } catch (e) {
      onError(e instanceof Error ? e.message : "Nalaganje ni uspelo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title="Slike" aside={images.length > 0 ? `${images.length}` : undefined}>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((img) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setViewing(img)}
            className="aspect-square overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl(img.path)}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </button>
        ))}
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed border-gray-300 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <IconImage className="h-5 w-5" />
          {busy ? "Nalagam …" : "Dodaj sliko"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = "";
          if (files.length) upload(files);
        }}
      />

      {viewing && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/80 p-4"
          onClick={() => setViewing(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl(viewing.path)}
            alt=""
            className="max-h-[80vh] max-w-full rounded-md object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button variant="secondary" onClick={() => setViewing(null)}>
              Zapri
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!confirm("Izbrišem to sliko?")) return;
                const id = viewing.id;
                setViewing(null);
                startTransition(async () => {
                  const res = await deleteImageAction(id);
                  onError(res.error ?? null);
                });
              }}
            >
              Izbriši
            </Button>
          </div>
        </div>
      )}
    </Section>
  );
}
