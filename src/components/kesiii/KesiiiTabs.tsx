"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "@/lib/utils/clsx";
import { IconMapPin, IconPackageSearch, IconUsers } from "@/components/ui/icons";

const TABS = [
  { href: "/kesiii", label: "Predmeti", Icon: IconPackageSearch },
  { href: "/kesiii/lokacije", label: "Lokacije", Icon: IconMapPin },
  { href: "/kesiii/gospodinjstvo", label: "Gospodinjstvo", Icon: IconUsers },
];

export default function KesiiiTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
      {TABS.map(({ href, label, Icon }) => {
        const active =
          href === "/kesiii"
            ? pathname === "/kesiii" || pathname.startsWith("/kesiii/predmet")
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium",
              active
                ? "border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label === "Gospodinjstvo" ? "Dom" : label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
