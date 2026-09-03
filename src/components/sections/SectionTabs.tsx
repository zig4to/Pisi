"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "@/lib/utils/clsx";
import type { Section } from "@/lib/types/database.types";
import { createSectionAction } from "@/actions/sections";
import PromptDialog from "@/components/ui/PromptDialog";
import { IconPlus } from "@/components/ui/icons";

export default function SectionTabs({
  notebookId,
  activeSectionId,
  sections,
}: {
  notebookId: string;
  activeSectionId: string;
  sections: Section[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex min-h-12 items-stretch border-b border-gray-200 bg-white pl-14 dark:border-gray-800 dark:bg-gray-900 md:min-h-0 md:pl-2">
      <div className="flex flex-1 items-center gap-1 overflow-x-auto px-2 py-1.5">
        {sections.map((sec) => {
          const active = sec.id === activeSectionId;
          return (
            <Link
              key={sec.id}
              href={`/belezke/${notebookId}/${sec.id}`}
              className={clsx(
                "flex flex-shrink-0 items-center gap-2 rounded-t-md border-b-2 px-3 py-1.5 text-sm font-medium",
                active
                  ? "border-blue-600 text-blue-700 dark:text-blue-300"
                  : "border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              )}
              style={active ? { borderColor: sec.color } : undefined}
            >
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: sec.color }}
              />
              <span className="max-w-[12rem] truncate">{sec.title}</span>
            </Link>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        aria-label="Nova sekcija"
        title="Nova sekcija"
        className="flex flex-shrink-0 items-center gap-1 border-l border-gray-200 bg-white px-3 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
      >
        <IconPlus />
        <span className="hidden sm:inline">Sekcija</span>
      </button>

      <PromptDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Nova sekcija"
        label="Ime sekcije"
        submitLabel="Ustvari"
        onSubmit={async (value) => {
          const fd = new FormData();
          fd.set("title", value);
          return createSectionAction(notebookId, {}, fd);
        }}
      />
    </div>
  );
}
