"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { KesiiiLocation } from "@/lib/types/database.types";
import {
  createLocationAction,
  deleteLocationAction,
  moveLocationAction,
  renameLocationAction,
} from "@/actions/kesiii";
import Button from "@/components/ui/Button";
import Menu, { MenuItem } from "@/components/ui/Menu";
import Modal from "@/components/ui/Modal";
import PromptDialog from "@/components/ui/PromptDialog";
import ItemDialog from "@/components/kesiii/ItemDialog";
import LocationPicker from "@/components/kesiii/LocationPicker";
import { nameSuggestions } from "@/lib/kesiii/tree";
import { IconPlus } from "@/components/ui/icons";

/** Gumbi za trenutno lokacijo: novo podmesto, nov predmet, preimenuj, premakni, izbriši. */
export default function LocationActions({
  current,
  locations,
}: {
  current: KesiiiLocation | null;
  locations: KesiiiLocation[];
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"add" | "rename" | "move" | "item" | null>(null);
  const [moveTarget, setMoveTarget] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const close = () => setDialog(null);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => setDialog("add")}>
          <IconPlus />
          {current ? "Novo mesto tukaj" : "Nova soba"}
        </Button>
        {current && (
          <>
            <Button
              onClick={() => setDialog("item")}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <IconPlus />
              Predmet tukaj
            </Button>
            <Menu>
              {(closeMenu) => (
                <>
                  <MenuItem
                    onClick={() => {
                      closeMenu();
                      setDialog("rename");
                    }}
                  >
                    Preimenuj
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      closeMenu();
                      setMoveTarget(current.parent_id);
                      setError(null);
                      setDialog("move");
                    }}
                  >
                    Premakni
                  </MenuItem>
                  <MenuItem
                    danger
                    onClick={() => {
                      closeMenu();
                      if (!confirm(`Izbrišem „${current.name}“?`)) return;
                      startTransition(async () => {
                        const res = await deleteLocationAction(current.id);
                        if (res.error) return setError(res.error);
                        setError(null);
                        router.push(
                          current.parent_id
                            ? `/kesiii/lokacije?l=${current.parent_id}`
                            : "/kesiii/lokacije"
                        );
                      });
                    }}
                  >
                    Izbriši
                  </MenuItem>
                </>
              )}
            </Menu>
          </>
        )}
      </div>
      {error && dialog === null && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <PromptDialog
        open={dialog === "add"}
        onClose={close}
        title={current ? `Novo mesto v „${current.name}“` : "Nova soba"}
        label="Ime"
        placeholder={current ? "npr. Omara, Zgornja polica, Modra škatla" : "npr. Klet"}
        submitLabel="Dodaj"
        suggestions={nameSuggestions(locations, current?.id ?? null)}
        onSubmit={async (value) => {
          const res = await createLocationAction(value, current?.id ?? null);
          if ("error" in res) return { error: res.error };
        }}
      />

      {current && (
        <PromptDialog
          open={dialog === "rename"}
          onClose={close}
          title="Preimenuj lokacijo"
          label="Ime"
          initialValue={current.name}
          onSubmit={(value) => renameLocationAction(current.id, value)}
        />
      )}

      {current && dialog === "item" && (
        <ItemDialog
          onClose={close}
          mode={{ kind: "create", locationId: current.id }}
          locations={locations}
        />
      )}

      {current && (
        <Modal open={dialog === "move"} onClose={close} title={`Kam premaknem „${current.name}“?`}>
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Z njo se premakne vse, kar je v njej.
            </p>
            <LocationPicker
              locations={locations}
              value={moveTarget}
              onChange={setMoveTarget}
            />
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={close}>
                Prekliči
              </Button>
              <Button
                type="button"
                disabled={pending}
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() =>
                  startTransition(async () => {
                    const res = await moveLocationAction(current.id, moveTarget);
                    if (res.error) return setError(res.error);
                    setError(null);
                    close();
                  })
                }
              >
                {pending ? "Premikam …" : "Premakni sem"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
