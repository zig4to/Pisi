"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconSearch } from "@/components/ui/icons";

export default function SearchBox({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        router.push(q ? `/iskanje?q=${encodeURIComponent(q)}` : "/iskanje");
      }}
      className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
    >
      <IconSearch className="h-4 w-4 flex-shrink-0 text-gray-400" />
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Išči po straneh …"
        className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
      />
    </form>
  );
}
