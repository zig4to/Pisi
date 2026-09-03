import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPageById } from "@/lib/data/pages";
import { getTags } from "@/lib/data/tags";
import PageEditor from "@/components/editor/PageEditor";

export default async function PagePage({
  params,
}: {
  params: Promise<{ notebookId: string; sectionId: string; pageId: string }>;
}) {
  const { notebookId, sectionId, pageId } = await params;
  const supabase = await createClient();

  const page = await getPageById(supabase, pageId).catch(() => null);
  if (!page || page.section_id !== sectionId) {
    redirect(`/belezke/${notebookId}/${sectionId}`);
  }

  const allTags = await getTags(supabase);

  return (
    <PageEditor
      key={page.id}
      notebookId={notebookId}
      sectionId={sectionId}
      page={page}
      allTags={allTags}
    />
  );
}
