import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, VzletTask } from "@/lib/types/database.types";

type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Vrne opravila za pogled Vzlet: vsa neopravljena (ne glede na starost — da jih
 * lahko prenesemo na danes) in nedavno opravljena (za današnji prikaz in
 * jutrišnji načrt).
 *
 * Strežnik ne pozna lokalnega dneva uporabnika, zato bere širše okno (zadnjih
 * ~3 dni po UTC); natančno razvrščanje v „danes/jutri“ naredi klient po
 * lokalnem datumu.
 */
export async function getVzletTasks(
  supabase: TypedSupabaseClient
): Promise<VzletTask[]> {
  const sinceDate = new Date(Date.now() - 3 * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const { data, error } = await supabase
    .from("pisi_vzlet_tasks")
    .select("*")
    .or(`done.eq.false,for_date.gte.${sinceDate}`)
    .order("for_date", { ascending: true })
    .order("done", { ascending: true })
    .order("position", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
