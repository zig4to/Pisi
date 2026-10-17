import { createClient } from "@/lib/supabase/server";
import { getProjects } from "@/lib/data/projekti";
import ProjectList from "@/components/projekti/ProjectList";

export default async function ProjektiPage() {
  const supabase = await createClient();
  const projects = await getProjects(supabase);

  return <ProjectList projects={projects} />;
}
