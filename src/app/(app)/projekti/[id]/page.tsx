import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/data/projekti";
import ProjectDetail from "@/components/projekti/ProjectDetail";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const data = await getProject(supabase, id);
  if (!data) notFound();

  return <ProjectDetail key={data.project.id} {...data} />;
}
