"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import type { PageWithTags, Tag, TiptapDoc } from "@/lib/types/database.types";
import {
  renamePageAction,
  togglePinPageAction,
  trashPageAction,
  updatePageContentAction,
} from "@/actions/pages";
import EditorToolbar from "@/components/editor/EditorToolbar";
import TagPicker from "@/components/tags/TagPicker";
import Menu, { MenuItem } from "@/components/ui/Menu";
import { IconPin } from "@/components/ui/icons";

type SaveState = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_MS = 800;

export default function PageEditor({
  notebookId,
  sectionId,
  page,
  allTags,
}: {
  notebookId: string;
  sectionId: string;
  page: PageWithTags;
  allTags: Tag[];
}) {
  const [, startTransition] = useTransition();
  const [title, setTitle] = useState(page.title);
  const [pinned, setPinned] = useState(page.is_pinned);
  const [contentSave, setContentSave] = useState<SaveState>("idle");
  const [titleSave, setTitleSave] = useState<SaveState>("idle");

  const contentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveContent = useCallback(
    async (doc: TiptapDoc, text: string) => {
      setContentSave("saving");
      const res = await updatePageContentAction(page.id, doc, text);
      setContentSave(res.ok ? "saved" : "error");
    },
    [page.id]
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Image,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: "Začni pisati …" }),
    ],
    content: page.content as unknown as JSONContent,
    editorProps: {
      attributes: {
        class: "pisi-prose min-h-full max-w-3xl px-1 py-2 text-[15px] leading-relaxed text-gray-900 dark:text-gray-100",
      },
    },
    onUpdate: ({ editor }) => {
      if (contentTimer.current) clearTimeout(contentTimer.current);
      setContentSave("saving");
      contentTimer.current = setTimeout(() => {
        const doc = editor.getJSON() as TiptapDoc;
        const text = editor.getText({ blockSeparator: "\n" });
        saveContent(doc, text);
      }, AUTOSAVE_MS);
    },
  });

  // Ob odhodu s strani shrani morebitne neshranjene spremembe.
  useEffect(() => {
    return () => {
      if (contentTimer.current) {
        clearTimeout(contentTimer.current);
        if (editor) {
          const doc = editor.getJSON() as TiptapDoc;
          const text = editor.getText({ blockSeparator: "\n" });
          void updatePageContentAction(page.id, doc, text);
        }
      }
      if (titleTimer.current) clearTimeout(titleTimer.current);
    };
  }, [editor, page.id]);

  const onTitleChange = (value: string) => {
    setTitle(value);
    setTitleSave("saving");
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(async () => {
      await renamePageAction(page.id, value);
      setTitleSave("saved");
    }, AUTOSAVE_MS);
  };

  const status =
    contentSave === "error" || titleSave === "error"
      ? "Napaka pri shranjevanju"
      : contentSave === "saving" || titleSave === "saving"
        ? "Shranjujem …"
        : contentSave === "saved" || titleSave === "saved"
          ? "Shranjeno"
          : "";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* naslov + akcije */}
      <div className="flex items-start gap-2 border-b border-gray-200 px-4 pb-2 pt-3 dark:border-gray-800">
        <div className="min-w-0 flex-1">
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={() => {
              if (titleTimer.current) clearTimeout(titleTimer.current);
              startTransition(async () => {
                await renamePageAction(page.id, title);
                setTitleSave("saved");
              });
            }}
            placeholder="Naslov strani"
            className="w-full bg-transparent text-2xl font-bold text-gray-900 outline-none placeholder:text-gray-300 dark:text-gray-100 dark:placeholder:text-gray-600"
          />
          <p className="mt-0.5 h-4 text-xs text-gray-400">{status}</p>
        </div>
        <Menu>
          {(close) => (
            <>
              <MenuItem
                onClick={() => {
                  close();
                  setPinned((v) => !v);
                  startTransition(() =>
                    togglePinPageAction(page.id, !pinned)
                  );
                }}
              >
                {pinned ? "Odpni stran" : "Pripni stran"}
              </MenuItem>
              <a
                href={`/belezke/${notebookId}/${sectionId}/${page.id}/izvozi`}
                onClick={() => close()}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Izvozi v Markdown
              </a>
              <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
              <MenuItem
                danger
                onClick={() => {
                  close();
                  if (confirm(`Premaknem stran "${title}" v koš?`)) {
                    startTransition(() =>
                      trashPageAction(page.id, notebookId, sectionId)
                    );
                  }
                }}
              >
                Premakni v koš
              </MenuItem>
            </>
          )}
        </Menu>
      </div>

      {/* značke */}
      <div className="border-b border-gray-200 px-4 py-2 dark:border-gray-800">
        <TagPicker
          pageId={page.id}
          allTags={allTags}
          initialSelected={page.tags}
        />
      </div>

      <EditorToolbar editor={editor} />

      {/* platno */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <EditorContent editor={editor} />
      </div>

      {pinned && (
        <span className="sr-only">
          <IconPin /> pripeto
        </span>
      )}
    </div>
  );
}
