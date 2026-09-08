import { createClient } from "@/lib/supabase/server";
import { getDonsTasks } from "@/lib/data/dons";
import DonsBoard from "@/components/dons/DonsBoard";

// „Dons“ (danes) — dnevni fokus na najpomembnejša opravila.
export default async function DonsPage() {
  const supabase = await createClient();
  const tasks = await getDonsTasks(supabase);

  return <DonsBoard tasks={tasks} />;
}
