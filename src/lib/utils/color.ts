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
