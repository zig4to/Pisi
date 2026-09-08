"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "@/lib/utils/clsx";
import {
  IconMenu,
  IconRocket,
  IconTrendingUp,
  IconX,
} from "@/components/ui/icons";
import IntroDialog from "@/components/vzlet/IntroDialog";

// Meni samo za strani „Vzlet“ (mobilno) — stoji na mestu, kjer je bil gumb za
// beležke.
export default function VzletMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // ob prehodu na drugo pot meni zapremo
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  const links = [
    { href: "/vzlet", label: "Misije", icon: <IconRocket className="h-4 w-4" /> },
    {
      href: "/vzlet/napredek",
      label: "Napredek",
      icon: <IconTrendingUp className="h-4 w-4" />,
    },
  ];

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Meni Vzlet"
        aria-expanded={open}
        className="flex rounded-md border border-gray-300 bg-white p-2 text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
      >
        {open ? <IconX /> : <IconMenu />}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 min-w-44 rounded-md border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:shadow-black/40">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "flex items-center gap-2 rounded px-2 py-1.5 text-sm font-medium",
                  active
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                )}
              >
                {l.icon}
                {l.label}
              </Link>
            );
          })}

          <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setIntroOpen(true);
            }}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <IconRocket className="h-4 w-4" />
            Cilj aplikacije
          </button>
        </div>
      )}

      <IntroDialog
        open={introOpen}
        onClose={() => setIntroOpen(false)}
        onDismiss={() => setIntroOpen(false)}
      />
    </div>
  );
}
