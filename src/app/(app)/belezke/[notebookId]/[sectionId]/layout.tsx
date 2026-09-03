import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNotebookById } from "@/lib/data/notebooks";
import { getSectionsByNotebook } from "@/lib/data/sections";
import { getPagesBySection } from "@/lib/data/pages";
import SectionTabs from "@/components/sections/SectionTabs";
import PageList from "@/components/pages/PageList";

export default async function SectionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ notebookId: string; sectionId: string }>;
}) {
  const { notebookId, sectionId } = await params;
  const supabase = await createClient();

  const notebook = await getNotebookById(supabase, notebookId).catch(() => null);
  if (!notebook) redirect("/");

  const sections = await getSectionsByNotebook(supabase, notebookId);
  const activeSection = sections.find((s) => s.id === sectionId);
  if (!activeSection) redirect(`/belezke/${notebookId}`);

  const pages = await getPagesBySection(supabase, sectionId);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionTabs
        notebookId={notebookId}
        activeSectionId={sectionId}
        sections={sections}
      />
      <div className="flex min-h-0 flex-1">
        <PageList
          notebook={notebook}
          notebookId={notebookId}
          sectionId={sectionId}
          sections={sections}
          pages={pages}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
