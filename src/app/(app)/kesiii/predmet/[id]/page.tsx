import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getItem, getItemMoves, getKesiiiContext } from "@/lib/data/kesiii";
import ItemDetail from "@/components/kesiii/ItemDetail";

export default async function KesiiiItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [ctx, item, moves] = await Promise.all([
    getKesiiiContext(supabase),
    getItem(supabase, id),
    getItemMoves(supabase, id),
  ]);
  if (!item) notFound();

  const names = Object.fromEntries(ctx.members.map((m) => [m.user_id, m.display_name]));

  return (
    <ItemDetail item={item} moves={moves} memberNames={names} locations={ctx.locations} />
  );
}
