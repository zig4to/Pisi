"use client";

import { useState, useTransition } from "react";
import type { KesiiiHousehold, KesiiiMember } from "@/lib/types/database.types";
import {
  joinHouseholdAction,
  leaveHouseholdAction,
  newJoinCodeAction,
  renameHouseholdAction,
  setDisplayNameAction,
} from "@/actions/kesiii";
import Button from "@/components/ui/Button";
import PromptDialog from "@/components/ui/PromptDialog";
import { IconCheck, IconUsers } from "@/components/ui/icons";

const CARD =
  "space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900";

export default function HouseholdPanel({
  household,
  members,
  currentUserId,
}: {
  household: KesiiiHousehold;
  members: KesiiiMember[];
  currentUserId: string;
}) {
  const [dialog, setDialog] = useState<"household" | "me" | null>(null);
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const me = members.find((m) => m.user_id === currentUserId);
  const alone = members.length <= 1;

  const run = (fn: () => Promise<{ error?: string }>, after?: () => void) =>
    startTransition(async () => {
      const res = await fn();
      if (res.error) return setError(res.error);
      setError(null);
      after?.();
    });

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <section className={CARD}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {household.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Vsi člani vidijo in urejajo iste lokacije in predmete.
            </p>
          </div>
          <Button variant="ghost" onClick={() => setDialog("household")}>
            Preimenuj
          </Button>
        </div>

        <ul className="space-y-1">
          {members.map((m) => (
            <li key={m.user_id} className="flex items-center gap-2 text-sm">
              <IconUsers className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900 dark:text-gray-100">{m.display_name || "Brez imena"}</span>
              {m.user_id === currentUserId && (
                <button
                  type="button"
                  onClick={() => setDialog("me")}
                  className="text-xs text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  (ti · spremeni ime)
                </button>
              )}
              {m.role === "owner" && <span className="text-xs text-gray-400">lastnik</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className={CARD}>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Povabi člana</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Pošlji to kodo partnerju ali družini. V Kesiii → Gospodinjstvo jo vpišejo pod „Pridruži se“.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-emerald-50 px-3 py-1.5 font-mono text-lg font-semibold tracking-widest text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            {household.join_code}
          </span>
          <Button
            variant="secondary"
            onClick={() => {
              navigator.clipboard?.writeText(household.join_code);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <IconCheck /> : null}
            {copied ? "Kopirano!" : "Kopiraj"}
          </Button>
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => {
              if (confirm("Ustvarim novo kodo? Stara ne bo več delovala.")) run(newJoinCodeAction);
            }}
          >
            Nova koda
          </Button>
        </div>
      </section>

      <section className={CARD}>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Pridruži se drugemu gospodinjstvu</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {alone
            ? "Tvoje sedanje lokacije in predmeti bodo izbrisani, ker si edini član."
            : "Zapustiš sedanje gospodinjstvo; njegovi podatki ostanejo ostalim članom."}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (alone && !confirm("Res? Tvoje sedanje lokacije in predmeti bodo izbrisani.")) return;
            run(() => joinHouseholdAction(code), () => setCode(""));
          }}
          className="flex gap-2"
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="KODA"
            maxLength={12}
            className="w-32 rounded-md border border-gray-300 px-3 py-2 font-mono text-sm uppercase tracking-widest outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          <Button
            type="submit"
            disabled={pending || !code.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 dark:disabled:bg-emerald-900"
          >
            Pridruži se
          </Button>
        </form>
      </section>

      {!alone && (
        <Button
          variant="ghost"
          className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
          disabled={pending}
          onClick={() => {
            if (confirm(`Zapustim „${household.name}“? Ustvari se ti novo, prazno gospodinjstvo.`)) {
              run(leaveHouseholdAction);
            }
          }}
        >
          Zapusti gospodinjstvo
        </Button>
      )}

      <PromptDialog
        open={dialog === "household"}
        onClose={() => setDialog(null)}
        title="Ime gospodinjstva"
        label="Ime"
        initialValue={household.name}
        onSubmit={renameHouseholdAction}
      />
      <PromptDialog
        open={dialog === "me"}
        onClose={() => setDialog(null)}
        title="Tvoje ime"
        label="Kako te vidijo ostali člani"
        initialValue={me?.display_name ?? ""}
        onSubmit={setDisplayNameAction}
      />
    </div>
  );
}
