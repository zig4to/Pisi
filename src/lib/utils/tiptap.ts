import type { TiptapDoc } from "@/lib/types/database.types";

export const EMPTY_DOC: TiptapDoc = { type: "doc", content: [] };

type Node = {
  type?: string;
  text?: string;
  content?: Node[];
};

/**
 * Iz Tiptap JSON dokumenta izlušči navadno besedilo (za iskanje in predogled).
 * Primarno besedilo pridobimo na klientu prek `editor.getText()`; ta funkcija
 * je zaledna varovalka (npr. pri uvozu ali migracijah).
 */
export function docToPlainText(doc: unknown): string {
  const out: string[] = [];

  const walk = (node: Node | undefined) => {
    if (!node) return;
    if (typeof node.text === "string") out.push(node.text);
    if (Array.isArray(node.content)) {
      node.content.forEach(walk);
      // groba ločnica med bloki
      if (
        node.type &&
        ["paragraph", "heading", "listItem", "blockquote", "codeBlock"].includes(
          node.type
        )
      ) {
        out.push("\n");
      }
    }
  };

  walk(doc as Node);
  return out.join("").replace(/\n{3,}/g, "\n\n").trim();
}
