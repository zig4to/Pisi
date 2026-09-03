import { createClient } from "@/lib/supabase/server";
import { tiptapJsonToMarkdown, safeFileName } from "@/lib/utils/markdown";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const supabase = await createClient();

  const { data: page, error } = await supabase
    .from("pisi_pages")
    .select("title, content")
    .eq("id", pageId)
    .is("deleted_at", null)
    .single();

  if (error || !page) {
    return new Response("Strani ni mogoče najti.", { status: 404 });
  }

  const md = `# ${page.title}\n\n${tiptapJsonToMarkdown(page.content)}`;

  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeFileName(page.title)}.md"`,
    },
  });
}
