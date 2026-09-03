import { createClient } from "@/lib/supabase/server";
import { tiptapJsonToMarkdown, safeFileName } from "@/lib/utils/markdown";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  const { sectionId } = await params;
  const supabase = await createClient();

  const { data: section } = await supabase
    .from("pisi_sections")
    .select("title")
    .eq("id", sectionId)
    .is("deleted_at", null)
    .single();

  if (!section) {
    return new Response("Sekcije ni mogoče najti.", { status: 404 });
  }

  const { data: pages, error } = await supabase
    .from("pisi_pages")
    .select("title, content")
    .eq("section_id", sectionId)
    .is("deleted_at", null)
    .order("is_pinned", { ascending: false })
    .order("position", { ascending: true });

  if (error) {
    return new Response("Napaka pri branju strani.", { status: 500 });
  }

  const body =
    `# ${section.title}\n\n` +
    (pages ?? [])
      .map(
        (p) => `## ${p.title}\n\n${tiptapJsonToMarkdown(p.content)}`
      )
      .join("\n\n---\n\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeFileName(section.title)}.md"`,
    },
  });
}
