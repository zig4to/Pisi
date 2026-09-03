// Pretvorba Tiptap JSON dokumenta v Markdown (za izvoz strani/sekcije).
// Podpira: naslove, krepko/ležeče/prečrtano/koda, povezave, sezname (tudi
// opravilne), citate, kodne bloke, slike, vodoravno črto.

type Mark = { type: string; attrs?: Record<string, unknown> };
type Node = {
  type?: string;
  text?: string;
  marks?: Mark[];
  attrs?: Record<string, unknown>;
  content?: Node[];
};

function applyMarks(text: string, marks: Mark[] | undefined): string {
  if (!marks || marks.length === 0) return text;
  let out = text;
  for (const mark of marks) {
    switch (mark.type) {
      case "bold":
        out = `**${out}**`;
        break;
      case "italic":
        out = `*${out}*`;
        break;
      case "strike":
        out = `~~${out}~~`;
        break;
      case "code":
        out = `\`${out}\``;
        break;
      case "underline":
        out = `<u>${out}</u>`;
        break;
      case "link": {
        const href = (mark.attrs?.href as string) ?? "";
        out = `[${out}](${href})`;
        break;
      }
    }
  }
  return out;
}

function inline(nodes: Node[] | undefined): string {
  if (!nodes) return "";
  return nodes
    .map((n) => {
      if (n.type === "text") return applyMarks(n.text ?? "", n.marks);
      if (n.type === "hardBreak") return "  \n";
      if (n.type === "image") {
        const src = (n.attrs?.src as string) ?? "";
        const alt = (n.attrs?.alt as string) ?? "";
        return `![${alt}](${src})`;
      }
      return inline(n.content);
    })
    .join("");
}

function listItems(node: Node, ordered: boolean, depth: number): string {
  const indent = "  ".repeat(depth);
  const items = node.content ?? [];
  return items
    .map((item, i) => {
      const checked = item.attrs?.checked;
      const bullet =
        typeof checked === "boolean"
          ? `- [${checked ? "x" : " "}] `
          : ordered
            ? `${i + 1}. `
            : "- ";
      const inner = (item.content ?? [])
        .map((child) => blockToMarkdown(child, depth + 1))
        .join("\n")
        .trim();
      // prvo vrstico obdrži ob bulletu, ostale zamakni
      const [first, ...rest] = inner.split("\n");
      const restIndented = rest.map((l) => `${indent}  ${l}`).join("\n");
      return `${indent}${bullet}${first}${restIndented ? "\n" + restIndented : ""}`;
    })
    .join("\n");
}

function blockToMarkdown(node: Node, depth = 0): string {
  switch (node.type) {
    case "doc":
      return (node.content ?? []).map((c) => blockToMarkdown(c)).join("\n\n");
    case "paragraph":
      return inline(node.content);
    case "heading": {
      const level = Math.min(Math.max(Number(node.attrs?.level ?? 1), 1), 6);
      return `${"#".repeat(level)} ${inline(node.content)}`;
    }
    case "bulletList":
      return listItems(node, false, depth);
    case "orderedList":
      return listItems(node, true, depth);
    case "taskList":
      return listItems(node, false, depth);
    case "blockquote":
      return (node.content ?? [])
        .map((c) => blockToMarkdown(c, depth))
        .join("\n\n")
        .split("\n")
        .map((l) => `> ${l}`)
        .join("\n");
    case "codeBlock": {
      const lang = (node.attrs?.language as string) ?? "";
      return `\`\`\`${lang}\n${inline(node.content)}\n\`\`\``;
    }
    case "horizontalRule":
      return "---";
    case "image": {
      const src = (node.attrs?.src as string) ?? "";
      const alt = (node.attrs?.alt as string) ?? "";
      return `![${alt}](${src})`;
    }
    default:
      return inline(node.content);
  }
}

export function tiptapJsonToMarkdown(doc: unknown): string {
  if (!doc || typeof doc !== "object") return "";
  return blockToMarkdown(doc as Node).replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

/** Očisti naslov strani v varno ime datoteke. */
export function safeFileName(title: string): string {
  const base = title.trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ");
  return (base || "stran").slice(0, 80);
}
