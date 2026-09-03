"use client";

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import clsx from "@/lib/utils/clsx";
import { createClient } from "@/lib/supabase/client";
import { IconImage } from "@/components/ui/icons";

const BUCKET = "pisi-images";

export default function ImageUploadButton({ editor }: { editor: Editor }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Nisi prijavljen.");

      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(path);

      editor.chain().focus().setImage({ src: publicUrl }).run();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nalaganje ni uspelo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        title="Vstavi sliko"
        aria-label="Vstavi sliko"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          "flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-200 disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-700"
        )}
      >
        <IconImage />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) upload(file);
        }}
      />
      {error && (
        <span className="ml-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
    </>
  );
}
