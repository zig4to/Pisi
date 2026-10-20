"use client";

import { Fragment, useState, useTransition, type ReactNode } from "react";
import clsx from "@/lib/utils/clsx";
import { STEP_DONE_PREFIX } from "@/lib/utils/projekti";
import { dayKey, daysBetween, formatDate, formatTime, shiftDayKey } from "@/lib/utils/dates";
import type { Project, ProjectEntry, ProjectStep } from "@/lib/types/database.types";
import { addEntryAction, deleteEntryAction, updateEntryAction } from "@/actions/projekti";
import Section from "@/components/projekti/Section";
import Button from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import Menu, { MenuItem } from "@/components/ui/Menu";
import {
  IconCalendar,
  IconCheck,
  IconFlag,
  IconFlame,
  IconHistory,
  IconPencil,
  IconPlus,
  IconRocket,
} from "@/components/ui/icons";

// ============ Pomožne funkcije (datumi, slovenske množine) ============

const DAY = 86_400_000;

/** Slovenska množina: [1, 2, 3–4, 5+] — npr. dan/dneva/dnevi/dni. */
function plural(n: number, forms: [string, string, string, string]) {
  const m = Math.abs(n) % 100;
  const form = m === 1 ? forms[0] : m === 2 ? forms[1] : m === 3 || m === 4 ? forms[2] : forms[3];
  return `${n} ${form}`;
}
const dni = (n: number) => plural(n, ["dan", "dneva", "dnevi", "dni"]);
const zapisov = (n: number) => plural(n, ["zapis", "zapisa", "zapisi", "zapisov"]);

function dayLabel(iso: string) {
  const diff = daysBetween(iso, new Date());
  if (diff === 0) return "Danes";
  if (diff === 1) return "Včeraj";
  return formatDate(iso, {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(dayKey(iso).slice(0, 4) !== dayKey(new Date()).slice(0, 4) ? { year: "numeric" } : {}),
  });
}

const rtf = new Intl.RelativeTimeFormat("sl", { numeric: "auto" });
function relative(iso: string) {
  const sec = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(sec);
  if (abs < 60) return "pravkar";
  if (abs < 3600) return rtf.format(Math.round(sec / 60), "minute");
  if (abs < DAY / 1000) return rtf.format(Math.round(sec / 3600), "hour");
  if (abs < (30 * DAY) / 1000) return rtf.format(Math.round(sec / (DAY / 1000)), "day");
  if (abs < (365 * DAY) / 1000) return rtf.format(Math.round(sec / ((30 * DAY) / 1000)), "month");
  return rtf.format(Math.round(sec / ((365 * DAY) / 1000)), "year");
}

/** Zaporedni dnevi z zapisom do danes (ali do včeraj, če danes še ni zapisa). */
function streak(days: Set<string>) {
  let key = dayKey(new Date());
  if (!days.has(key)) key = shiftDayKey(key, 1);
  let n = 0;
  while (days.has(key)) {
    n++;
    key = shiftDayKey(key, 1);
  }
  return n;
}

// ============ Dnevnik dela ============

export default function Journal({
  project,
  entries,
  steps,
  onError,
}: {
  project: Project;
  /** najnovejši najprej */
  entries: ProjectEntry[];
  steps: ProjectStep[];
  onError: (e: string | null) => void;
}) {
  const [body, setBody] = useState("");
  // polje za nov zapis je strnjeno v gumb, dokler ga ne odpreš
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState<{ id: string; body: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const call = (action: () => Promise<{ error?: string }>, after?: () => void) =>
    startTransition(async () => {
      const res = await action();
      onError(res.error ?? null);
      if (!res.error) after?.();
    });

  const add = () => {
    if (!body.trim()) return;
    call(
      () => addEntryAction(project.id, body),
      () => {
        setBody("");
        setComposing(false);
      }
    );
  };

  // ---- statistika ----
  const activeDays = new Set(entries.map((e) => dayKey(e.created_at)));
  const currentStreak = streak(activeDays);
  const projectDay = daysBetween(project.created_at, project.completed_at ?? new Date()) + 1;

  // ---- napredek ob vsakem opravljenem koraku (kronološko) ----
  const stepProgress = new Map<string, number>();
  entries
    .filter((e) => e.body.startsWith(STEP_DONE_PREFIX))
    .reverse()
    .forEach((e, i) => stepProgress.set(e.id, i + 1));
  const firstEntryId = entries.at(-1)?.id;

  // ---- skupine po dnevih (najnovejši dan najprej) ----
  const groups: { key: string; iso: string; items: ProjectEntry[] }[] = [];
  for (const e of entries) {
    const key = dayKey(e.created_at);
    const last = groups.at(-1);
    if (last?.key === key) last.items.push(e);
    else groups.push({ key, iso: e.created_at, items: [e] });
  }

  return (
    <Section title="Dnevnik dela">
      {/* statistika */}
      <div className="grid grid-cols-4 gap-2">
        <Stat label="Zapisi" value={entries.length} />
        <Stat label="Aktivni dnevi" value={activeDays.size} />
        <Stat
          label="Niz"
          value={
            <span className="inline-flex items-center gap-1">
              <IconFlame
                className={clsx(
                  "h-4 w-4",
                  currentStreak > 0 ? "text-orange-500" : "text-gray-300 dark:text-gray-600"
                )}
              />
              {currentStreak}
            </span>
          }
          hint={currentStreak > 0 ? `${dni(currentStreak)} zapored` : "Brez niza"}
        />
        <Stat
          label={project.completed_at ? "Trajanje" : "Dan projekta"}
          value={project.completed_at ? dni(projectDay) : projectDay}
        />
      </div>

      {/* nov zapis — strnjen v gumb, ob kliku se razpre */}
      {composing ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-2 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-500/15 dark:border-gray-800 dark:bg-gray-950/40 dark:focus-within:border-violet-700">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                add();
              }
              if (e.key === "Escape" && !body.trim()) setComposing(false);
            }}
            autoFocus
            rows={2}
            placeholder="Kaj si naredil danes? npr. Odstranil stare ploščice"
            className="w-full resize-none bg-transparent px-1.5 py-1 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
          />
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="hidden text-[11px] text-gray-400 sm:inline">
              <kbd className="rounded border border-gray-300 px-1 font-sans dark:border-gray-700">
                Ctrl
              </kbd>{" "}
              +{" "}
              <kbd className="rounded border border-gray-300 px-1 font-sans dark:border-gray-700">
                Enter
              </kbd>{" "}
              doda zapis
            </span>
            <Button
              variant="ghost"
              className="ml-auto py-1.5"
              onClick={() => {
                setBody("");
                setComposing(false);
              }}
            >
              Prekliči
            </Button>
            <Button
              onClick={add}
              disabled={pending || !body.trim()}
              className="bg-violet-600 py-1.5 hover:bg-violet-700 disabled:bg-violet-300 dark:disabled:bg-violet-900"
            >
              <IconPlus />
              Dodaj zapis
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setComposing(true)}
          className="flex w-full items-center gap-2 rounded-xl border border-dashed border-gray-300 px-3 py-2.5 text-left text-sm text-gray-500 transition-colors hover:border-violet-400 hover:bg-violet-50/50 hover:text-violet-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-violet-700 dark:hover:bg-violet-950/30 dark:hover:text-violet-300"
        >
          <IconPlus />
          Dodaj zapis …
        </button>
      )}

      {/* časovnica */}
      <div className="relative pt-2">
        {/* navpična črta — zbledi proti dnu */}
        <div
          aria-hidden
          className="absolute bottom-4 left-[15px] top-4 w-0.5 rounded-full bg-gradient-to-b from-violet-400 via-violet-200 to-gray-200 dark:from-violet-600 dark:via-violet-900 dark:to-gray-800"
        />

        <ol className="relative space-y-5">
          {project.completed_at && (
            <Milestone
              icon={<IconFlag className="h-4 w-4" />}
              tone="emerald"
              title="Projekt dokončan"
              meta={`${formatDate(project.completed_at)} · trajal ${dni(projectDay)}`}
            />
          )}

          {groups.map((g, gi) => {
            const next = groups[gi + 1];
            // premor med tem in prejšnjim (starejšim) aktivnim dnem
            const gap = next ? daysBetween(next.iso, g.iso) - 1 : 0;
            return (
              <Fragment key={g.key}>
                <li className="relative pl-11">
                  {/* oznaka dneva */}
                  <span
                    aria-hidden
                    className="absolute left-[11px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-violet-400 bg-white dark:border-violet-600 dark:bg-gray-900"
                  />
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="text-sm font-semibold capitalize text-gray-900 dark:text-gray-100">
                      {dayLabel(g.iso)}
                    </h3>
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                      Dan {daysBetween(project.created_at, g.iso) + 1}
                    </span>
                    <span className="text-[11px] text-gray-400">{zapisov(g.items.length)}</span>
                  </div>

                  <ul className="mt-2.5 space-y-2.5">
                    {g.items.map((entry) => (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        stepNo={stepProgress.get(entry.id)}
                        stepsTotal={steps.length}
                        isFirst={entry.id === firstEntryId}
                        editing={editing?.id === entry.id ? editing.body : null}
                        pending={pending}
                        onEdit={() => setEditing({ id: entry.id, body: entry.body })}
                        onEditChange={(value) => setEditing({ id: entry.id, body: value })}
                        onCancel={() => setEditing(null)}
                        onSave={() =>
                          call(
                            () => updateEntryAction(entry.id, editing!.body),
                            () => setEditing(null)
                          )
                        }
                        onDelete={() => {
                          if (!confirm("Izbrišem ta zapis?")) return;
                          call(() => deleteEntryAction(entry.id));
                        }}
                      />
                    ))}
                  </ul>
                </li>

                {gap >= 1 && (
                  <li className="relative flex items-center gap-2 pl-11 text-[11px] font-medium text-gray-400">
                    <IconHistory className="absolute left-[9px] h-3.5 w-3.5 bg-white dark:bg-gray-900" />
                    {dni(gap)} premora
                  </li>
                )}
              </Fragment>
            );
          })}

          {entries.length === 0 && (
            <li className="pl-11 text-sm text-gray-400">
              Še ni zapisov. Zapiši, kaj si naredil — ali obkljukaj korak.
            </li>
          )}

          <Milestone
            icon={<IconRocket className="h-4 w-4" />}
            tone="violet"
            title="Začetek projekta"
            meta={formatDate(project.created_at, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          />
        </ol>
      </div>
    </Section>
  );
}

// ============ Gradniki ============

function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div
      title={hint}
      className="rounded-lg border border-gray-100 bg-gradient-to-b from-gray-50 to-white px-2 py-2 text-center dark:border-gray-800 dark:from-gray-800/60 dark:to-gray-900"
    >
      <div className="text-base font-bold tabular-nums text-gray-900 dark:text-gray-100">
        {value}
      </div>
      <div className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-wide text-gray-400">
        {label}
      </div>
    </div>
  );
}

function Milestone({
  icon,
  tone,
  title,
  meta,
}: {
  icon: ReactNode;
  tone: "violet" | "emerald";
  title: string;
  meta: string;
}) {
  return (
    <li className="relative flex min-h-8 flex-col justify-center pl-11">
      <span
        className={clsx(
          "absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full text-white shadow-md ring-4 ring-white dark:ring-gray-900",
          tone === "emerald"
            ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/30"
            : "bg-gradient-to-br from-violet-500 to-indigo-600 shadow-violet-500/30"
        )}
      >
        {icon}
      </span>
      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</span>
      <span className="text-xs capitalize text-gray-500 dark:text-gray-400">{meta}</span>
    </li>
  );
}

function EntryCard({
  entry,
  stepNo,
  stepsTotal,
  isFirst,
  editing,
  pending,
  onEdit,
  onEditChange,
  onCancel,
  onSave,
  onDelete,
}: {
  entry: ProjectEntry;
  /** zaporedna številka opravljenega koraka (samo za samodejne zapise korakov) */
  stepNo?: number;
  stepsTotal: number;
  isFirst: boolean;
  /** besedilo v urejanju; null = ne ureja se */
  editing: string | null;
  pending: boolean;
  onEdit: () => void;
  onEditChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const isStep = entry.body.startsWith(STEP_DONE_PREFIX);
  const text = isStep ? entry.body.slice(STEP_DONE_PREFIX.length) : entry.body;
  const edited =
    new Date(entry.updated_at).getTime() - new Date(entry.created_at).getTime() > 60_000;
  const pct =
    isStep && stepNo && stepsTotal ? Math.min(100, Math.round((stepNo / stepsTotal) * 100)) : null;

  return (
    <li className="relative">
      {/* vozlišče na časovnici */}
      <span
        className={clsx(
          "absolute -left-11 top-2 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-900",
          isStep
            ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
            : "border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300"
        )}
      >
        {isStep ? (
          <IconCheck className="h-4 w-4" strokeWidth="2.5" />
        ) : (
          <IconPencil className="h-3.5 w-3.5" />
        )}
      </span>

      <div
        className={clsx(
          "group",
          // opravljeni koraki brez okvirja — le vrstica ob zeleni kljukici
          isStep
            ? "px-0.5 py-1.5"
            : "rounded-xl border border-gray-200 bg-white p-3 transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:shadow-black/30"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <time
              dateTime={entry.created_at}
              className="font-semibold tabular-nums text-gray-700 dark:text-gray-300"
            >
              {formatTime(entry.created_at)}
            </time>
            <span suppressHydrationWarning className="text-gray-400">
              {relative(entry.created_at)}
            </span>
            {isStep && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                Opravljen korak
              </span>
            )}
            {isFirst && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                <IconCalendar className="h-3 w-3" />
                Prvi zapis
              </span>
            )}
            {edited && <span className="text-gray-400">· urejeno</span>}
          </div>
          {editing === null && (
            <Menu>
              {(close) => (
                <>
                  <MenuItem
                    onClick={() => {
                      close();
                      onEdit();
                    }}
                  >
                    Uredi
                  </MenuItem>
                  <MenuItem
                    danger
                    onClick={() => {
                      close();
                      onDelete();
                    }}
                  >
                    Izbriši
                  </MenuItem>
                </>
              )}
            </Menu>
          )}
        </div>

        {editing !== null ? (
          <div className="mt-2 space-y-2">
            <Textarea
              autoFocus
              rows={3}
              value={editing}
              onChange={(e) => onEditChange(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={onCancel}>
                Prekliči
              </Button>
              <Button
                disabled={pending}
                className="bg-violet-600 hover:bg-violet-700"
                onClick={onSave}
              >
                Shrani
              </Button>
            </div>
          </div>
        ) : (
          <p
            className={clsx(
              "mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed",
              isStep
                ? "font-medium text-gray-900 dark:text-gray-100"
                : "text-gray-800 dark:text-gray-200"
            )}
          >
            {text}
          </p>
        )}

        {/* napredek projekta ob tem koraku */}
        {pct !== null && editing === null && (
          <div className="mt-2.5 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-950">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[11px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
              Korak {stepNo}/{stepsTotal} · {pct} %
            </span>
          </div>
        )}
      </div>
    </li>
  );
}
