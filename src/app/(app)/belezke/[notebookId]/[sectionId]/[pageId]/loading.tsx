// Obris urejevalnika, dokler strežnik ne vrne strani — klik takoj nekaj pokaže.
// Postavitev sledi PageEditor (naslov, orodna vrstica, besedilo).
const BAR = "rounded bg-gray-200 dark:bg-gray-800";

export default function PageLoading() {
  return (
    <div className="flex min-h-0 flex-1 animate-pulse flex-col" aria-busy aria-label="Nalagam stran">
      <div className="border-b border-gray-200 px-4 pb-2 pt-3 dark:border-gray-800">
        <div className={`h-8 w-2/5 ${BAR}`} />
        <div className="mt-0.5 h-4" />
      </div>
      <div className="flex gap-1.5 border-b border-gray-200 px-4 py-2 dark:border-gray-800">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className={`h-7 w-7 ${BAR}`} />
        ))}
      </div>
      <div className="space-y-3 px-4 py-4">
        {["w-11/12", "w-4/5", "w-10/12", "w-3/5"].map((w) => (
          <div key={w} className={`h-4 ${w} ${BAR}`} />
        ))}
      </div>
    </div>
  );
}
