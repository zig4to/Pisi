"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { KesiiiItem, KesiiiLocation, KesiiiMove } from "@/lib/types/database.types";
import { ancestorsOf } from "@/lib/kesiii/tree";
import { deleteItemAction, updateItemAction } from "@/actions/kesiii";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Field, Input, Textarea } from "@/components/ui/Input";
import ItemDialog from "@/components/kesiii/ItemDialog";
import {
  IconArrowLeft,
  IconChevronRight,
  IconHistory,
  IconMapPin,
  IconMove,
} from "@/components/ui/icons";

const dateFmt = new Intl.DateTimeFormat("sl-SI", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function where(path: string | null, detail: string) {
  return [path, detail].filter(Boolean).join(" · ") || "Neznano";
}

export default function ItemDetail({
  item,
  moves,
  memberNames,
  locations,
}: {
  item: KesiiiItem;
  moves: KesiiiMove[];
  memberNames: Record<string, string>;
  locations: KesiiiLocation[];
}) {
  const router = useRouter();
  const [moving, setMoving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [note, setNote] = useState(item.note);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const chain = ancestorsOf(locations, item.location_id);

  return (
    <div className="space-y-5">
      <Link
        href="/kesiii"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <IconArrowLeft className="h-4 w-4" />
        Nazaj
      </Link>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{item.name}</h2>
        {item.note && (
          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">
            {item.note}
          </p>
        )}
      </div>

      {/* kje je */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          <IconMapPin className="h-3.5 w-3.5" />
          Kje je
        </p>
        {chain.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1 text-base font-medium text-gray-900 dark:text-gray-100">
            {chain.map((loc, i) => (
              <span key={loc.id} className="flex items-center gap-1">
                {i > 0 && <IconChevronRight className="h-4 w-4 text-gray-400" />}
                <Link href={`/kesiii/lokacije?l=${loc.id}`} className="hover:underline">
                  {loc.name}
                </Link>
              </span>
            ))}
          </div>
        ) : (
          !item.location_detail && (
            <p className="text-base text-gray-500 dark:text-gray-400">Neznano</p>
          )
        )}
        {item.location_detail && (
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{item.location_detail}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setMoving(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <IconMove />
          Premaknil sem
        </Button>
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Uredi
        </Button>
        <Button
          variant="ghost"
          className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
          disabled={pending}
          onClick={() => {
            if (!confirm(`Izbrišem „${item.name}“?`)) return;
            startTransition(async () => {
              const res = await deleteItemAction(item.id);
              if (res.error) return setError(res.error);
              router.push("/kesiii");
            });
          }}
        >
          Izbriši
        </Button>
      </div>
      {error && !editing && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {/* zgodovina */}
      <section className="space-y-2">
        <h3 className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
          <IconHistory className="h-4 w-4" />
          Zgodovina
        </h3>
        <ol className="space-y-3 border-l border-gray-200 pl-4 dark:border-gray-800">
          {moves.map((m) => (
            <li key={m.id} className="text-sm">
              <p className="text-xs text-gray-400">
                {dateFmt.format(new Date(m.moved_at))}
                {m.moved_by && memberNames[m.moved_by] && ` · ${memberNames[m.moved_by]}`}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-400 line-through">{where(m.from_path, m.from_detail)}</span>
                {" → "}
                {where(m.to_path, m.to_detail)}
              </p>
            </li>
          ))}
          <li className="text-sm">
            <p className="text-xs text-gray-400">
              {dateFmt.format(new Date(item.created_at))}
              {item.created_by && memberNames[item.created_by] && ` · ${memberNames[item.created_by]}`}
            </p>
            <p className="text-gray-700 dark:text-gray-300">Dodano</p>
          </li>
        </ol>
      </section>

      {moving && (
        <ItemDialog
          onClose={() => setMoving(false)}
          mode={{ kind: "move", item }}
          locations={locations}
        />
      )}

      <Modal open={editing} onClose={() => setEditing(false)} title="Uredi predmet">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const res = await updateItemAction(item.id, { name, note });
              if (res.error) return setError(res.error);
              setError(null);
              setEditing(false);
            });
          }}
          className="space-y-4"
        >
          <Field label="Ime" htmlFor="kesiii-edit-name">
            <Input
              id="kesiii-edit-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Opomba" htmlFor="kesiii-edit-note">
            <Textarea
              id="kesiii-edit-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
              Prekliči
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Shranjujem …" : "Shrani"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
