export function ColorDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      className={"inline-block h-3 w-3 flex-shrink-0 rounded-[4px] " + (className ?? "")}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

export function TagBadge({ color, name }: { color: string; name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
      <ColorDot color={color} />
      {name}
    </span>
  );
}
