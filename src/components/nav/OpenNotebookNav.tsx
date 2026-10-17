"use client";

import { useEffect } from "react";

/**
 * Ob prihodu na /belezke (npr. z gumba „Beležke“ na začetni strani) na
 * odpre stranski predal z beležkami, da lahko uporabnik izbere
 * beležko — namesto da bi ga vrglo naravnost v strani.
 *
 * `setTimeout(0)` poskrbi, da se sproži za `Sidebar`-jevim učinkom, ki ob
 * spremembi poti predal zapre.
 */
export default function OpenNotebookNav() {
  useEffect(() => {
    const t = setTimeout(() => {
      window.dispatchEvent(new Event("pisi:open-notebook-nav"));
    }, 0);
    return () => clearTimeout(t);
  }, []);

  return null;
}
