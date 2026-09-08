import { createClient } from "@/lib/supabase/server";
import { getNotebookTree } from "@/lib/data/notebooks";
import Sidebar from "@/components/nav/Sidebar";
import SsoHashCleanup from "@/components/auth/SsoHashCleanup";
import IntroFirstRun from "@/components/vzlet/IntroFirstRun";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tree = await getNotebookTree(supabase);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <SsoHashCleanup />
      <IntroFirstRun />
      <Sidebar tree={tree} userEmail={user?.email ?? null} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
