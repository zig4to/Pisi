import Link from "next/link";
import { IconBook } from "@/components/ui/icons";

// Začetna stran aplikacije. Stranski meni (beležke) je vedno na voljo prek
// postavitve `(app)/layout.tsx`. Tu ponudimo kratko predstavitev in vstop v
// Beležke.
export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* ikona + ime + slogan */}
        <div className="flex flex-col items-center text-center">
          <svg
            viewBox="0 0 512 512"
            className="mb-4 h-16 w-16 rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/10"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient
                id="pisi-app-icon"
                x1="0"
                y1="0"
                x2="512"
                y2="512"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#6366F1" />
                <stop offset="1" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            <rect width="512" height="512" rx="112" fill="url(#pisi-app-icon)" />
            <path
              d="M168 128h136a56 56 0 0 1 56 56v144a56 56 0 0 1-56 56H168V128Z"
              fill="#fff"
              fillOpacity="0.95"
            />
            <rect x="140" y="160" width="28" height="40" rx="6" fill="#fff" />
            <rect x="140" y="236" width="28" height="40" rx="6" fill="#fff" />
            <rect x="140" y="312" width="28" height="40" rx="6" fill="#fff" />
            <rect x="200" y="188" width="120" height="20" rx="10" fill="#3B82F6" />
            <rect x="200" y="246" width="120" height="20" rx="10" fill="#6366F1" />
            <rect x="200" y="304" width="80" height="20" rx="10" fill="#3B82F6" />
          </svg>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            Pisi
          </h1>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            Beležke, sekcije in strani — vse tvoje misli na enem mestu.
          </p>
        </div>

        {/* glavna pot */}
        <div className="mt-8">
          <Link
            href="/belezke"
            className="group flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-5 text-center transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-800 dark:hover:bg-blue-950"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
              <IconBook className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Beležke
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Zapiski, sekcije in strani
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
