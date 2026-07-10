"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import { Pin } from "lucide-react";
import { DeleteDialog } from "@/components/delete-dialog";
import { EditorSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/toast";
import { categoryMeta, statusMeta, type NoteCategory, type NoteStatus } from "@/lib/constants";
import { countWords } from "@/lib/format";
import type { Note } from "@/lib/notes";

const MarkdownPreview = dynamic(
  () => import("@/components/markdown-preview").then((m) => m.MarkdownPreview),
  {
    loading: () => <div className="h-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />,
    ssr: false,
  },
);

type NoteEditorProps = {
  noteId: string;
  initialNote?: Note;
};

export function NoteEditor({ noteId, initialNote }: NoteEditorProps) {
  const [note, setNote] = useState<Note | null>(initialNote ?? null);
  const [loadError, setLoadError] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    initialNote ? "saved" : "idle",
  );
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(initialNote ? new Date() : null);
  const [showDelete, setShowDelete] = useState(false);
  const saveVersionRef = useRef(0);
  const router = useRouter();
  const toast = useToast();
  const deferredContent = useDeferredValue(note?.content ?? "");

  useEffect(() => {
    if (initialNote) return;

    void fetch(`/api/notes/${noteId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load note");
        setNote(await res.json());
        setSaveState("saved");
        setLastSavedAt(new Date());
      })
      .catch(() => {
        setLoadError(true);
        setNote(null);
      });
  }, [noteId, initialNote]);

  const saveNote = useCallback(
    async (payload: Partial<Note>) => {
      if (!note) return;

      const version = ++saveVersionRef.current;
      setSaveState("saving");

      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (version !== saveVersionRef.current) return;

      if (!res.ok) {
        setSaveState("error");
        toast("Failed to save note");
        return;
      }

      const updated = await res.json();
      setNote(updated);
      setSaveState("saved");
      setLastSavedAt(new Date());
      setIsDirty(false);
    },
    [note, noteId, toast],
  );

  useEffect(() => {
    if (!note || !isDirty) return;

    const timer = setTimeout(() => {
      void saveNote({ title: note.title, content: note.content });
    }, 500);

    return () => clearTimeout(timer);
  }, [note, note?.title, note?.content, isDirty, saveNote]);

  function markDirty(updater: (prev: Note) => Note) {
    setIsDirty(true);
    setNote((prev) => (prev ? updater(prev) : prev));
    setSaveState("idle");
  }

  function updateMeta(payload: Partial<Note>) {
    setIsDirty(true);
    setNote((prev) => (prev ? { ...prev, ...payload } : prev));
    void saveNote(payload);
  }

  function insertMarkdown(prefix: string, suffix = "") {
    markDirty((prev) => ({ ...prev, content: `${prev.content}${prefix}text${suffix}\n` }));
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "s") {
        e.preventDefault();
        if (note) void saveNote({ title: note.title, content: note.content });
      }
      if (e.key === "b") {
        e.preventDefault();
        insertMarkdown("**", "**");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  async function remove() {
    const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    if (!res.ok) {
      toast("Failed to delete note");
      return;
    }
    toast("Note deleted");
    router.push("/");
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-6xl p-8 text-center">
        <p className="mb-4 text-zinc-600 dark:text-zinc-300">Note not found or failed to load.</p>
        <Button onClick={() => router.push("/")}>Back to dashboard</Button>
      </div>
    );
  }

  if (!note) {
    return <EditorSkeleton />;
  }

  const saveLabel =
    saveState === "saving"
      ? "Saving..."
      : saveState === "error"
        ? "Save failed"
        : isDirty
          ? "Unsaved changes"
          : lastSavedAt
            ? `Saved ${lastSavedAt.toLocaleTimeString()}`
            : "Saved";

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-sm text-zinc-600 hover:underline dark:text-zinc-300">
          Back to dashboard
        </Link>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <button
            onClick={() => updateMeta({ pinned: !note.pinned })}
            aria-label={note.pinned ? "Unpin note" : "Pin note"}
            className="rounded border border-zinc-300 px-2 py-1 focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700"
          >
            <Pin size={14} className={note.pinned ? "inline fill-current" : "inline"} />
          </button>
          <span aria-live="polite">{saveLabel}</span>
          <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => setShowDelete(true)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <input
          value={note.title}
          onChange={(e) => markDirty((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Untitled"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <Select
          value={note.category}
          onChange={(e) => updateMeta({ category: e.target.value as NoteCategory })}
          aria-label="Note category"
        >
          {Object.entries(categoryMeta).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </Select>
        <Select
          value={note.status}
          onChange={(e) => updateMeta({ status: e.target.value as NoteStatus })}
          aria-label="Note status"
        >
          {Object.entries(statusMeta).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="mb-2 flex flex-wrap gap-2">
        <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => insertMarkdown("**", "**")}>
          Bold
        </Button>
        <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => insertMarkdown("# ")}>
          Heading
        </Button>
        <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => insertMarkdown("- ")}>
          List
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <textarea
          value={note.content}
          onChange={(e) => markDirty((prev) => ({ ...prev, content: e.target.value }))}
          className="min-h-[70vh] rounded-xl border border-zinc-300 bg-white p-4 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="# Write markdown..."
        />
        <article className="prose min-h-[70vh] max-w-none overflow-auto rounded-xl border border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <MarkdownPreview content={deferredContent} />
        </article>
      </div>

      <p className="mt-2 text-xs text-zinc-500">{countWords(note.content)} words</p>

      <DeleteDialog
        open={showDelete}
        onCancel={() => setShowDelete(false)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
