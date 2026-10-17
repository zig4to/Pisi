// Skupno strežniku in odjemalcu (brez Supabase odjemalca).

export const IMAGE_BUCKET = "pisi-images";

/** Javni URL slike v bucketu `pisi-images` (bucket je javen za branje). */
export function imageUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}/${path}`;
}
