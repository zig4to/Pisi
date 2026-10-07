"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import LocationPicker, { type PickerLocation } from "@/components/kesiii/LocationPicker";
import { createItemAction, moveItemAction } from "@/actions/kesiii";

type Mode =
  | { kind: "create"; locationId?: string | null }
  | {
      kind: "move";
      item: { id: string; name: string; location_id: string | null; location_detail: string };
    };

/**
 * Dodajanje novega predmeta ali „Premaknil sem“ za obstoječega. Starš ga
 * izriše samo, ko je odprt, zato se obrazec ob vsakem odprtju začne na novo.
 */
export default function ItemDialog({
  onClose,
  mode,
  locations,
}: {
  onClose: () => void;
  mode: Mode;
  locations: PickerLocation[];
}) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [locationId, setLocationId] = useState<string | null>(
    mode.kind === "move" ? mode.item.location_id : (mode.locationId ?? null)
  );
  const [detail, setDetail] = useState(
    mode.kind === "move" ? mode.item.location_detail : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      if (mode.kind === "move") {
        const res = await moveItemAction(mode.item.id, locationId, detail);
        if (res.error) return setError(res.error);
        onClose();
        return;
      }
      const res = await createItemAction({ name, note, locationId, detail });
      if ("error" in res) return setError(res.error);
      onClose();
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={mode.kind === "move" ? `Kam si premaknil „${mode.item.name}“?` : "Nov predmet"}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-4"
      >
        {mode.kind === "create" && (
          <Field label="Kaj shranjuješ?" htmlFor="kesiii-name">
            <Input
              id="kesiii-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="npr. Božični okraski"
            />
          </Field>
        )}

        <div>
          <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Kje?</p>
          <LocationPicker
            locations={locations}
            value={locationId}
            onChange={setLocationId}
          />
        </div>

        <Field label="Natančneje (neobvezno)" htmlFor="kesiii-detail">
          <Input
            id="kesiii-detail"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="npr. zgornja polica, zadaj levo"
          />
        </Field>

        {mode.kind === "create" && (
          <Field label="Opomba (neobvezno)" htmlFor="kesiii-note">
            <Textarea
              id="kesiii-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Prekliči
          </Button>
          <Button
            type="submit"
            disabled={pending}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 dark:disabled:bg-emerald-900"
          >
            {pending ? "Shranjujem …" : mode.kind === "move" ? "Premakni" : "Shrani"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
