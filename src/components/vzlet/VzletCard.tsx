import Link from "next/link";
import { IconFlame, IconRocket } from "@/components/ui/icons";

type VzletCardProps = {
  points: number;
  streak: number;
  showStats: boolean;
};

export default function VzletCard({
  points,
  streak,
  showStats,
}: VzletCardProps) {
  return (
    <Link
      href="/vzlet"
      className="group flex w-full flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-5 text-center transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-800 dark:hover:bg-blue-950"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
        <IconRocket className="h-5 w-5" />
      </span>
      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        Vzlet
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        Najpomembnejše za danes
      </span>
      {showStats && (
        <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300">
          <span
            className={
              points >= 0
                ? "text-gray-900 dark:text-gray-100"
                : "text-red-600 dark:text-red-400"
            }
          >
            {points} točk
          </span>
          {streak > 0 && (
            <span className="inline-flex items-center gap-0.5 text-orange-500 dark:text-orange-400">
              · <IconFlame className="h-3.5 w-3.5" />
              {streak}
            </span>
          )}
        </span>
      )}
    </Link>
  );
}
