"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import clsx from "@/lib/utils/clsx";
import type { Tag } from "@/lib/types/database.types";
import { COLOR_PALETTE } from "@/lib/utils/color";
import {
  createTagAction,
  deleteTagAction,
  renameTagAction,
  setTagColorAction,
  type TagFormState,
} from "@/actions/tags";
import { ColorDot } from "@/components/ui/Badge";
import Menu, { MenuItem } from "@/components/ui/Menu";
import PromptDialog from "@/components/ui/PromptDialog";
import { IconPlus } from "@/components/ui/icons";
import { useActionState } from "react";

const initialState: TagFormState = {};

export default function TagManager({
  tags,
  activeTagId,
}: {
  tags: Tag[];
  activeTagId: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    createTagAction,
    initialState
  );
  const [, startTransition] = useTransition();
  const [rename, setRename] = useState<{ id: string; value: string } | null>(
    null
  );

  return (
    <div className="space-y-3">
      <form action={formAction} className="flex gap-2">
        <input
          name="name"
          placeholder="Nova značka …"
          className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <IconPlus />
          Dodaj
        </button>
      </form>
      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <ul className="flex flex-wrap gap-2">
        {tags.length === 0 && (
          <li className="text-sm text-gray-400">Ni značk.</li>
        )}
        {tags.map((tag) => (
          <li
            key={tag.id}
            className={clsx(
              "flex items-center gap-1.5 rounded-full border py-1 pl-2.5 pr-1 text-sm",
              tag.id === activeTagId
                ? "border-blue-400 bg-blue-50 dark:border-blue-700 dark:bg-blue-950"
                : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
            )}
          >
            <Link
              href={`/znacke?tag=${tag.id}`}
              className="flex items-center gap-1.5 font-medium text-gray-800 dark:text-gray-200"
            >
              <ColorDot color={tag.color} />
              {tag.name}
            </Link>
            <Menu align="left">
              {(close) => (
                <>
                  <MenuItem
                    onClick={() => {
                      close();
                      setRename({ id: tag.id, value: tag.name });
                    }}
                  >
                    Preimenuj
                  </MenuItem>
                  <div className="px-2 py-1.5">
                    <p className="mb-1 text-xs text-gray-400">Barva</p>
                    <div className="grid grid-cols-5 gap-1">
                      {COLOR_PALETTE.map((c) => (
                        <button
                          key={c}
                          type="button"
                          aria-label={`Barva ${c}`}
                          onClick={() => {
                            close();
                            startTransition(() =>
                              setTagColorAction(tag.id, c)
                            );
                          }}
                          className="h-5 w-5 rounded-full border border-black/10"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                  <MenuItem
                    danger
                    onClick={() => {
                      close();
                      if (
                        confirm(
                          `Izbrišem značko "${tag.name}"? Odstrani se z vseh strani.`
                        )
                      ) {
                        startTransition(() => deleteTagAction(tag.id));
                      }
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

      <PromptDialog
        open={rename !== null}
        onClose={() => setRename(null)}
        title="Preimenuj značko"
        label="Ime značke"
        initialValue={rename?.value ?? ""}
        onSubmit={async (value) => {
          if (rename) await renameTagAction(rename.id, value);
        }}
      />
    </div>
  );
}
