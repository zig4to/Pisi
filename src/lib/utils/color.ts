// Preset paleta barv za samodejno dodelitev novi beležki / znački.
// Barve so izbrane tako, da so med seboj dovolj različne in berljive.
export const COLOR_PALETTE = [
  "#3B82F6", // modra
  "#F97316", // oranžna
  "#10B981", // zelena
  "#EF4444", // rdeča
  "#8B5CF6", // vijolična
  "#EC4899", // roza
  "#14B8A6", // turkizna
  "#F59E0B", // jantarna
  "#6366F1", // indigo
  "#84CC16", // limeta
] as const;

/**
 * Vrne naslednjo barvo iz palete glede na trenutno število elementov
 * (round-robin), da so barve zaporednih elementov čim bolj različne.
 */
export function nextColor(existingCount: number): string {
  const index = existingCount % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

/**
 * Barva, ki je med `used` še ni: najprej prosta barva iz palete, nato odtenki
 * z zlatim kotom (137,5°), ki se ne ponovijo.
 */
export function uniqueColor(used: (string | null)[]): string {
  const taken = new Set(used.filter(Boolean).map((c) => c!.toLowerCase()));
  const free = COLOR_PALETTE.find((c) => !taken.has(c.toLowerCase()));
  if (free) return free;
  for (let n = 0; ; n++) {
    const color = `hsl(${Math.round((n * 137.508 + 20) % 360)} 65% 50%)`;
    if (!taken.has(color)) return color;
  }
}

/** Barva projekta; za projekte brez shranjene barve (pred 0010) izpeljana iz ID-ja. */
export function projectColor(project: { id: string; color: string | null }): string {
  if (project.color) return project.color;
  let hash = 0;
  for (let i = 0; i < project.id.length; i++)
    hash = (hash * 31 + project.id.charCodeAt(i)) | 0;
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
}
