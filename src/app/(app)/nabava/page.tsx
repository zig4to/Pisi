import { createClient } from "@/lib/supabase/server";
import { getNabava } from "@/lib/data/nabava";
import NabavaList from "@/components/nabava/NabavaList";

export default async function NabavaPage() {
  const supabase = await createClient();
  const { categories, items, projects } = await getNabava(supabase);

  return <NabavaList categories={categories} items={items} projects={projects} />;
}
