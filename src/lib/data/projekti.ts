import type { SupabaseClient } from "@supabase/supabase-js";
import { uniqueColor } from "@/lib/utils/color";
import type {
  Database,
  NabavaCategory,
  NabavaItem,
  Project,
  ProjectEntry,
  ProjectImage,
  ProjectStep,
  ProjectSummary,
} from "@/lib/types/database.types";

type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Poskrbi, da ima vsak projekt svojo barvo: projekti brez barve ali s
 * podvojeno barvo (kasneje ustvarjeni) dobijo prosto barvo, ki se shrani.
 */
async function ensureDistinctColors(supabase: TypedSupabaseClient, projects: Project[]) {
  const used: string[] = [];
  const fixes: { id: string; color: string }[] = [];
  for (const p of [...projects].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    const taken = used.some((c) => c.toLowerCase() === p.color?.toLowerCase());
    if (p.color && !taken) {
      used.push(p.color);
      continue;
    }
    const color = uniqueColor([...used, ...projects.map((x) => x.color)]);
    used.push(color);
    p.color = color;
    fixes.push({ id: p.id, color });
  }
  await Promise.all(
    fixes.map((f) => supabase.from("pisi_projects").update({ color: f.color }).eq("id", f.id))
  );
}

/** Vsi projekti uporabnika s povzetkom (koraki, nabava, strošek, zadnji zapis). */
export async function getProjects(supabase: TypedSupabaseClient): Promise<ProjectSummary[]> {
  const [projects, steps, items, entries] = await Promise.all([
    supabase.from("pisi_projects").select("*").order("created_at", { ascending: false }),
    supabase.from("pisi_project_steps").select("project_id, done_at"),
    supabase
      .from("pisi_nabava_items")
      .select("project_id, bought_at, price")
      .not("project_id", "is", null),
    supabase.from("pisi_project_entries").select("project_id, created_at"),
  ]);
  if (projects.error) throw projects.error;
  if (steps.error) throw steps.error;
  if (items.error) throw items.error;
  if (entries.error) throw entries.error;

  await ensureDistinctColors(supabase, projects.data ?? []);

  return (projects.data ?? []).map((p) => {
    const ps = (steps.data ?? []).filter((s) => s.project_id === p.id);
    const pi = (items.data ?? []).filter((i) => i.project_id === p.id);
    const last = (entries.data ?? [])
      .filter((e) => e.project_id === p.id)
      .reduce<string | null>((max, e) => (!max || e.created_at > max ? e.created_at : max), null);
    return {
      ...p,
      stepsDone: ps.filter((s) => s.done_at).length,
      stepsTotal: ps.length,
      openItems: pi.filter((i) => !i.bought_at).length,
      cost: pi.reduce((sum, i) => sum + (Number(i.price) || 0), 0),
      lastEntryAt: last,
    };
  });
}

export type ProjectDetailData = {
  project: Project;
  entries: ProjectEntry[];
  steps: ProjectStep[];
  images: ProjectImage[];
  items: NabavaItem[];
  categories: NabavaCategory[];
  /** vse trgovine iz Nabave (predlogi v obrazcu izdelka) */
  stores: string[];
};

/** En projekt z vsem, kar sodi zraven; `null`, če ga ni. */
export async function getProject(
  supabase: TypedSupabaseClient,
  id: string
): Promise<ProjectDetailData | null> {
  const [project, entries, steps, images, items, categories, stores] = await Promise.all([
    supabase.from("pisi_projects").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("pisi_project_entries")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("pisi_project_steps")
      .select("*")
      .eq("project_id", id)
      .order("position")
      .order("created_at"),
    supabase
      .from("pisi_project_images")
      .select("*")
      .eq("project_id", id)
      .order("created_at"),
    supabase.from("pisi_nabava_items").select("*").eq("project_id", id).order("name"),
    supabase.from("pisi_nabava_categories").select("*").order("name"),
    supabase.from("pisi_nabava_items").select("store").neq("store", ""),
  ]);
  if (project.error) throw project.error;
  if (!project.data) return null;
  for (const res of [entries, steps, images, items, categories, stores]) {
    if (res.error) throw res.error;
  }

  return {
    project: project.data,
    entries: entries.data ?? [],
    steps: steps.data ?? [],
    images: images.data ?? [],
    items: items.data ?? [],
    categories: categories.data ?? [],
    stores: [...new Set((stores.data ?? []).map((s) => s.store))].sort((a, b) =>
      a.localeCompare(b, "sl")
    ),
  };
}
