"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "@/lib/utils/clsx";
import { IconRocket, IconTrendingUp } from "@/components/ui/icons";

const TABS = [
  { href: "/vzlet", label: "Misije", icon: <IconRocket /> },
  { href: "/vzlet/napredek", label: "Napredek", icon: <IconTrendingUp /> },
];

export default function VzletTabs() {
  const pathname = usePathname();

  return (
    <div className="flex min-h-12 items-stretch gap-1 border-b border-gray-200 bg-white pl-2 pr-14 dark:border-gray-800 dark:bg-gray-900 md:min-h-0 md:pr-2">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300"
                : "border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            )}
          >
            {tab.icon}
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
