import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNotebookById } from "@/lib/data/notebooks";
import { getSectionsByNotebook } from "@/lib/data/sections";
import { IconChevronRight } from "@/components/ui/icons";

export default async function NotebookPage({
  params,
}: {
  params: Promise<{ notebookId: string }>;
}) {
  const { notebookId } = await params;
  const supabase = await createClient();

  const notebook = await getNotebookById(supabase, notebookId).catch(() => null);
  if (!notebook) redirect("/");

  const sections = await getSectionsByNotebook(supabase, notebookId);
  if (sections.length > 0) {
    redirect(`/belezke/${notebookId}/${sections[0].id}`);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {notebook.title}
      </h1>
      <p className="mt-1 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
        Ta beležka še nima sekcij. Dodaj jo z gumbom
        <IconChevronRight className="inline h-4 w-4" />
        <span className="font-medium">„+“</span> ob beležki.
      </p>
    </div>
  );
}
