import { createClient } from "@/lib/supabase/server";
import { getTrashedItems } from "@/lib/data/trash";
import TrashList from "@/components/trash/TrashList";

export default async function KosPage() {
  const supabase = await createClient();
  const items = await getTrashedItems(supabase);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-6 pt-14 md:pt-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Koš
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Obnovljeni elementi se vrnejo na svoje mesto. Trajno brisanje odstrani
        element in vse, kar je v njem.
      </p>
      <TrashList items={items} />
    </div>
  );
}
