"use client";

/** Že uporabljena imena mest — tap doda mesto s tem imenom. */
export default function SuggestionChips({
  suggestions,
  disabled,
  onPick,
}: {
  suggestions: string[];
  disabled?: boolean;
  onPick: (name: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {suggestions.map((name) => (
        <button
          key={name}
          type="button"
          disabled={disabled}
          // mousedown namesto click: polje ne izgubi fokusa, preden izberemo
          onMouseDown={(e) => {
            e.preventDefault();
            onPick(name);
          }}
          className="rounded-full border border-gray-300 bg-white px-2.5 py-0.5 text-xs text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-emerald-800 dark:hover:bg-emerald-950"
        >
          {name}
        </button>
      ))}
    </div>
  );
}
