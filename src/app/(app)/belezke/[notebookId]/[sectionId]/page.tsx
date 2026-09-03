import { createClient } from "@/lib/supabase/server";
import { getFirstPageId } from "@/lib/data/pages";
import { IconChevronRight } from "@/components/ui/icons";

export default async function SectionEmptyPage({
  params,
}: {
  params: Promise<{ notebookId: string; sectionId: string }>;
}) {
  const { sectionId } = await params;
  const supabase = await createClient();

  const hasPages = (await getFirstPageId(supabase, sectionId)) !== null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <h2 className="text-base font-medium text-gray-700 dark:text-gray-300">
        {hasPages ? "Izberi stran" : "Prazna sekcija"}
      </h2>
      <p className="mt-1 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
        {hasPages ? (
          <>Klikni stran na seznamu za urejanje.</>
        ) : (
          <>
            Ustvari prvo stran z gumbom
            <IconChevronRight className="inline h-4 w-4" />
            <span className="font-medium">„Nova stran“</span>.
          </>
        )}
      </p>
    </div>
  );
}
