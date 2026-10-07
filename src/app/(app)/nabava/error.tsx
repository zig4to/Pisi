"use client";

import Button from "@/components/ui/Button";

// Najpogostejši vzrok: SQL migracija 0007_nabava.sql še ni zagnana
// (PostgREST ne najde tabele → PGRST205 / 42P01).
export default function NabavaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const missingSchema = /PGRST202|PGRST205|42P01|pisi_nabava/.test(error.message);

  return (
    <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm dark:border-red-900 dark:bg-red-950/40">
      <p className="font-semibold text-red-800 dark:text-red-200">
        {missingSchema ? "Baza za Nabavo še ni pripravljena." : "Prišlo je do napake."}
      </p>
      <p className="text-red-700 dark:text-red-300">
        {missingSchema
          ? "V Supabase → SQL Editor zaženi supabase/migrations/0007_nabava.sql, nato osveži stran."
          : error.message}
      </p>
      <Button variant="secondary" onClick={reset}>
        Poskusi znova
      </Button>
    </div>
  );
}
