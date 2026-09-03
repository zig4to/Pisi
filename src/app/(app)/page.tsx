import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNotebookTree } from "@/lib/data/notebooks";
import { IconBook } from "@/components/ui/icons";

export default async function HomePage() {
  const supabase = await createClient();
  const tree = await getNotebookTree(supabase);

  if (tree.length > 0) {
    redirect(`/belezke/${tree[0].id}`);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <IconBook className="mb-4 h-10 w-10 text-gray-300 dark:text-gray-600" />
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Dobrodošel v Pisi
      </h1>
      <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        Ustvari prvo beležko z gumbom{" "}
        <span className="font-medium">„Nova beležka“</span> v stranski vrstici.
        Znotraj beležke dodajaš sekcije, znotraj sekcij pa strani.
      </p>
    </div>
  );
}
