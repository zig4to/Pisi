import type { ReactNode } from "react";

/** Skupni okvir razdelka strani projekta. */
export default function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        {aside && <span className="text-xs text-gray-500 dark:text-gray-400">{aside}</span>}
      </div>
      {children}
    </section>
  );
}
