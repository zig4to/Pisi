import Link from "next/link";

export default function ProjektiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {/* mobilna glava — naslov levo, v isti vrstici kot gumba desno zgoraj (h-12) */}
      <header className="sticky top-0 z-10 flex h-12 items-center bg-gray-50/95 px-6 backdrop-blur md:hidden dark:bg-gray-950/95">
        <Link href="/projekti" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Projekti
        </Link>
      </header>
      <div className="mx-auto w-full max-w-2xl space-y-4 p-6 pt-2 md:pt-6">
        <Link
          href="/projekti"
          className="hidden text-xl font-semibold text-gray-900 md:block dark:text-gray-100"
        >
          Projekti
        </Link>
        {children}
      </div>
    </div>
  );
}
