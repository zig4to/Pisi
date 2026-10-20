"use client";

import { useState } from "react";
import { TIME_ZONE } from "@/lib/utils/dates";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "@/lib/utils/clsx";
import { projectColor } from "@/lib/utils/color";
import type { ProjectSummary } from "@/lib/types/database.types";
import { createProjectAction } from "@/actions/projekti";
import { formatPrice } from "@/components/nabava/NabavaList";
import { ColorDot } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PromptDialog from "@/components/ui/PromptDialog";
import { IconPlus } from "@/components/ui/icons";

type Tab = "open" | "done";

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("sl-SI", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

export default function ProjectList({ projects }: { projects: ProjectSummary[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("open");
  const [creating, setCreating] = useState(false);

  const open = projects.filter((p) => !p.completed_at);
  const done = projects
    .filter((p) => p.completed_at)
    .sort((a, b) => b.completed_at!.localeCompare(a.completed_at!));
  const shown = tab === "open" ? open : done;

  const tabs: { value: Tab; label: string; count: number }[] = [
    { value: "open", label: "Odprti", count: open.length },
    { value: "done", label: "Dokončano", count: done.length },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-gray-200/70 p-1 dark:bg-gray-800">
        {tabs.map((t) => (
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
            <span className="ml-1.5 font-normal text-gray-400">{t.count}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {tab === "open"
            ? open.length === 0
              ? "Ni odprtih projektov."
              : `${open.length} odprtih`
            : `${done.length} dokončanih`}
        </p>
        <Button onClick={() => setCreating(true)} className="bg-violet-600 hover:bg-violet-700">
          <IconPlus />
          Nov projekt
        </Button>
      </div>

      <div
        aria-hidden
        className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-700"
      />

      {shown.length === 0 && (
        <p className="py-6 text-center text-sm text-gray-400">
          {tab === "open"
            ? "Začni nov projekt z gumbom Nov projekt."
            : "Še noben projekt ni dokončan."}
        </p>
      )}

      <ul className="space-y-2">
        {shown.map((p) => (
          <li key={p.id}>
            <ProjectCard project={p} />
          </li>
        ))}
      </ul>

      <PromptDialog
        open={creating}
        onClose={() => setCreating(false)}
        title="Nov projekt"
        label="Ime projekta"
        placeholder="npr. Zamenjava pip v kopalnici"
        submitLabel="Ustvari"
        onSubmit={async (value) => {
          const res = await createProjectAction(value);
          if ("error" in res) return res;
          router.push(`/projekti/${res.id}`);
        }}
      />
    </div>
  );
}

function ProjectCard({ project: p }: { project: ProjectSummary }) {
  const pct = p.stepsTotal ? Math.round((p.stepsDone / p.stepsTotal) * 100) : 0;
  const facts = [
    p.stepsTotal > 0 && `Koraki ${p.stepsDone}/${p.stepsTotal}`,
    p.openItems > 0 && `Za kupit: ${p.openItems}`,
    p.cost > 0 && formatPrice(p.cost),
  ].filter(Boolean);
  const color = projectColor(p);

  return (
    <Link
      href={`/projekti/${p.id}`}
      style={{ borderLeftColor: color }}
      className="block space-y-2 rounded-lg border border-l-4 border-gray-200 bg-white px-4 py-3 transition-colors hover:border-violet-300 hover:bg-violet-50/40 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-violet-800 dark:hover:bg-violet-950/30"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <ColorDot color={color} />
          <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
            {p.title}
          </span>
        </span>
        {p.completed_at && (
          <span className="flex-shrink-0 text-xs text-gray-400">
            Dokončano {formatDate(p.completed_at)}
          </span>
        )}
      </div>
      {p.stepsTotal > 0 && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div className="h-full rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="w-9 flex-shrink-0 text-right text-xs font-medium tabular-nums text-violet-600 dark:text-violet-400">
            {pct} %
          </span>
        </div>
      )}
      {facts.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{facts.join(" · ")}</p>
      )}
    </Link>
  );
}
