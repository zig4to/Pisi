"use client";

import { useTransition } from "react";
import type { TrashItem, TrashKind } from "@/lib/types/database.types";
import {
  deleteForeverAction,
  emptyTrashAction,
  restoreItemAction,
} from "@/actions/trash";
import Button from "@/components/ui/Button";
import { IconRestore, IconTrash } from "@/components/ui/icons";

const KIND_LABEL: Record<TrashKind, string> = {
  notebook: "Beležka",
  section: "Sekcija",
  page: "Stran",
};

export default function TrashList({ items }: { items: TrashItem[] }) {
  const [pending, startTransition] = useTransition();

  if (items.length === 0) {
    return <p className="text-sm text-gray-400">Koš je prazen.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="danger"
          disabled={pending}
          onClick={() => {
            if (
              confirm(
                "Trajno izbrišem vse iz koša? Tega dejanja ni mogoče razveljaviti."
              )
            ) {
              startTransition(() => emptyTrashAction());
            }
          }}
        >
          Izprazni koš
        </Button>
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={`${item.kind}-${item.id}`}
            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                {item.title}
              </p>
              <p className="text-xs text-gray-400">
                {KIND_LABEL[item.kind]}
                {item.context ? ` · ${item.context}` : ""} ·{" "}
                {new Date(item.deleted_at).toLocaleDateString("sl-SI")}
              </p>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(() => restoreItemAction(item.kind, item.id))
              }
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <IconRestore />
              Obnovi
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (
                  confirm(
                    `Trajno izbrišem "${item.title}"? Tega ni mogoče razveljaviti.`
                  )
                ) {
                  startTransition(() =>
                    deleteForeverAction(item.kind, item.id)
                  );
                }
              }}
              className="inline-flex items-center gap-1 rounded-md border border-red-300 px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
            >
              <IconTrash />
              Izbriši
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
