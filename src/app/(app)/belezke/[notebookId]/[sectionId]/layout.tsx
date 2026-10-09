import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNotebookById } from "@/lib/data/notebooks";
import { getSectionsByNotebook } from "@/lib/data/sections";
import { getPagesBySection } from "@/lib/data/pages";
import SectionTabs from "@/components/sections/SectionTabs";
import PageList from "@/components/pages/PageList";

type Settled<T> = { value: T } | { error: unknown };
const ok = <T,>(value: T): Settled<T> => ({ value });
const fail = (error: unknown): Settled<never> => ({ error });
function unwrap<T>(res: Settled<T>): T {
  if ("error" in res) throw res.error;
  return res.value;
}

export default async function SectionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ notebookId: string; sectionId: string }>;
}) {
  const { notebookId, sectionId } = await params;
  const supabase = await createClient();

  // poizvedbe so neodvisne — hkrati namesto ena za drugo. Napake sekcij in strani
  // se upoštevajo šele po preusmeritvah, da neveljaven ID še vedno preusmeri.
  const [notebook, sectionsRes, pagesRes] = await Promise.all([
    getNotebookById(supabase, notebookId).catch(() => null),
    getSectionsByNotebook(supabase, notebookId).then(ok, fail),
    getPagesBySection(supabase, sectionId).then(ok, fail),
  ]);
  if (!notebook) redirect("/");

  const sections = unwrap(sectionsRes);
  const activeSection = sections.find((s) => s.id === sectionId);
  if (!activeSection) redirect(`/belezke/${notebookId}`);

  const pages = unwrap(pagesRes);

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
