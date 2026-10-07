import KesiiiTabs from "@/components/kesiii/KesiiiTabs";

export default function KesiiiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-6 pt-14 md:pt-6">
      <div className="space-y-3">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Kesiii</h1>
        <KesiiiTabs />
      </div>
      {children}
    </div>
  );
}
