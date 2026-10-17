import { createClient } from "@/lib/supabase/client";
import { IMAGE_BUCKET } from "@/lib/utils/images";

/**
 * Naključni UUID v4. `crypto.randomUUID` obstaja le na varnem izvoru (https ali
 * localhost) — ne pa, ko aplikacijo odpreš prek http://<IP> v domačem omrežju.
 * `crypto.getRandomValues` je na voljo povsod.
 */
function randomId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/**
 * Naloži sliko v bucket `pisi-images` pod `<user_id>/[mapa/]<uuid>.<ext>`
 * (storage politike dovolijo pisanje le v lastno mapo).
 */
export async function uploadImage(
  file: File,
  folder?: string
): Promise<{ path: string; publicUrl: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nisi prijavljen.");

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = [user.id, folder, `${randomId()}.${ext}`]
    .filter(Boolean)
    .join("/");

  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return { path, publicUrl };
}
