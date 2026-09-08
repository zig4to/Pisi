import { createClient } from "@/lib/supabase/server";
import { getNotebookTree } from "@/lib/data/notebooks";
import { IconBook } from "@/components/ui/icons";
import OpenNotebookNav from "@/components/nav/OpenNotebookNav";

// Vstopna točka za beležke: pokaže seznam beležk (stransko vrstico / predal),
// ne odpre pa strani. Beležko izbereš sam.
export default async function BelezkeIndexPage() {
  const supabase = await createClient();
  const tree = await getNotebookTree(supabase);
  const hasNotebooks = tree.length > 0;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <OpenNotebookNav />
      <IconBook className="mb-4 h-10 w-10 text-gray-300 dark:text-gray-600" />
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {hasNotebooks ? "Izberi beležko" : "Ni beležk"}
      </h1>
      <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        {hasNotebooks ? (
          "Izberi beležko v stranski vrstici, da odpreš njene sekcije in strani."
        ) : (
          <>
            Ustvari prvo beležko z gumbom{" "}
            <span className="font-medium">„Nova beležka“</span> v stranski
            vrstici. Znotraj beležke dodajaš sekcije, znotraj sekcij pa strani.
          </>
        )}
      </p>
    </div>
  );
}
