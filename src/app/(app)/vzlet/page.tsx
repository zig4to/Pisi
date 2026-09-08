import { createClient } from "@/lib/supabase/server";
import { getVzletTasks } from "@/lib/data/vzlet";
import VzletBoard from "@/components/vzlet/VzletBoard";

// „Vzlet“ — dnevni fokus na najpomembnejša opravila.
export default async function VzletPage() {
  const supabase = await createClient();
  const tasks = await getVzletTasks(supabase);

  return <VzletBoard tasks={tasks} />;
}
