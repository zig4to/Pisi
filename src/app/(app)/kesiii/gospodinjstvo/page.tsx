import { createClient } from "@/lib/supabase/server";
import { getKesiiiContext } from "@/lib/data/kesiii";
import HouseholdPanel from "@/components/kesiii/HouseholdPanel";

export default async function KesiiiHouseholdPage() {
  const supabase = await createClient();
  const [ctx, userRes] = await Promise.all([getKesiiiContext(supabase), supabase.auth.getUser()]);

  return (
    <HouseholdPanel
      household={ctx.household}
      members={ctx.members}
      currentUserId={userRes.data.user?.id ?? ""}
    />
  );
}
