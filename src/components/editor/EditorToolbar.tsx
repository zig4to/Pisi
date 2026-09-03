"use client";

import type { Editor } from "@tiptap/react";
import type { ReactNode } from "react";
import clsx from "@/lib/utils/clsx";
import ImageUploadButton from "@/components/editor/ImageUploadButton";
import {
  IconBold,
  IconCheckSquare,
  IconCode,
  IconH1,
  IconH2,
  IconH3,
  IconItalic,
  IconLink,
  IconList,
  IconListOrdered,
  IconQuote,
  IconRedo,
  IconStrike,
  IconUnderline,
  IconUndo,
} from "@/components/ui/icons";

function Btn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "flex h-8 w-8 items-center justify-center rounded transition-colors disabled:opacity-40",
        active
          ? "bg-blue-600 text-white"
          : "text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
      )}
    >
      {children}
    </button>
  );
}

const Divider = () => (
  <span className="mx-1 h-5 w-px bg-gray-300 dark:bg-gray-700" />
);

export default function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Povezava (URL):", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-white px-2 py-1 dark:border-gray-800 dark:bg-gray-900">
      <Btn
        title="Razveljavi"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <IconUndo />
      </Btn>
      <Btn
        title="Uveljavi"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <IconRedo />
      </Btn>
      <Divider />
      <Btn
        title="Krepko"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <IconBold />
      </Btn>
      <Btn
        title="Ležeče"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <IconItalic />
      </Btn>
      <Btn
        title="Podčrtano"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <IconUnderline />
      </Btn>
      <Btn
        title="Prečrtano"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <IconStrike />
      </Btn>
      <Divider />
      <Btn
        title="Naslov 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
      >
        <IconH1 />
      </Btn>
      <Btn
        title="Naslov 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        <IconH2 />
      </Btn>
      <Btn
        title="Naslov 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
      >
        <IconH3 />
      </Btn>
      <Divider />
      <Btn
        title="Označen seznam"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <IconList />
      </Btn>
      <Btn
        title="Oštevilčen seznam"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <IconListOrdered />
      </Btn>
      <Btn
        title="Opravilni seznam"
        active={editor.isActive("taskList")}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        <IconCheckSquare />
      </Btn>
      <Divider />
      <Btn
        title="Citat"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <IconQuote />
      </Btn>
      <Btn
        title="Kodni blok"
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <IconCode />
      </Btn>
      <Btn title="Povezava" active={editor.isActive("link")} onClick={setLink}>
        <IconLink />
      </Btn>
      <ImageUploadButton editor={editor} />
    </div>
  );
}
