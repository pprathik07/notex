"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { Copy, Pin, Search, Trash2 } from "lucide-react";
import { DeleteDialog } from "@/components/delete-dialog";
import { Badge, NoteCardSkeleton } from "@/components/skeletons";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast";
import { categoryMeta, statusMeta, type NoteCategory } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/format";
import { sortNotes, type NoteListItem } from "@/lib/notes";
import { cn } from "@/lib/utils";

const NotesBoard = dynamic(() => import("@/components/notes-board").then((m) => m.NotesBoard), {
  loading: () => (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-48 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      ))}
    </div>
  ),
  ssr: false,
});

type NotesDashboardProps = {
  initialNotes: NoteListItem[];
  userName: string;
};

export function NotesDashboard({ initialNotes, userName }: NotesDashboardProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [view, setView] = useState<"list" | "board">("list");
  const [searching, setSearching] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const saved = localStorage.getItem("notex-view");
    if (saved === "list" || saved === "board") setView(saved);
  }, []);

  const isInitialMount = useRef(true);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (!debouncedQuery) return;
    }

    let cancelled = false;
    setSearching(true);

    const url = debouncedQuery ? `/api/notes?q=${encodeURIComponent(debouncedQuery)}` : "/api/notes";
    void fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to search notes");
        if (!cancelled) setNotes(await res.json());
      })
      .catch(() => {
        if (!cancelled) toast("Failed to load notes");
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, toast]);

  const filtered = useMemo(() => {
    if (debouncedQuery) return sortNotes(notes);
    const text = query.trim().toLowerCase();
    if (!text) return sortNotes(notes);
    return sortNotes(
      notes.filter(
        (note) =>
          note.title.toLowerCase().includes(text) || note.excerpt.toLowerCase().includes(text),
      ),
    );
  }, [notes, query, debouncedQuery]);

  function toggleView() {
    setView((prev) => {
      const next = prev === "list" ? "board" : "list";
      localStorage.setItem("notex-view", next);
      return next;
    });
  }

  async function createNote() {
    const res = await fetch("/api/notes", { method: "POST" });
    if (!res.ok) {
      toast("Failed to create note");
      return;
    }
    const note = await res.json();
    toast("Note created");
    router.push(`/notes/${note.id}`);
  }

  const patchNote = useCallback(
    async (id: string, payload: Partial<NoteListItem>, optimistic = true) => {
      const previous = notes;
      if (optimistic) {
        setNotes((prev) =>
          sortNotes(
            prev.map((n) =>
              n.id === id
                ? {
                    ...n,
                    ...payload,
                    excerpt: payload.excerpt ?? n.excerpt,
                  }
                : n,
            ),
          ),
        );
      }

      setPendingIds((prev) => new Set(prev).add(id));
      const res = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      if (!res.ok) {
        setNotes(previous);
        toast("Failed to update note");
        return;
      }

      const updated = await res.json();
      setNotes((prev) =>
        sortNotes(
          prev.map((n) =>
            n.id === updated.id
              ? {
                  id: updated.id,
                  title: updated.title,
                  excerpt: updated.content?.slice(0, 200) ?? n.excerpt,
                  category: updated.category,
                  status: updated.status,
                  pinned: updated.pinned,
                  updatedAt: updated.updatedAt,
                }
              : n,
          ),
        ),
      );
    },
    [notes, toast],
  );

  async function duplicateNote(id: string) {
    setPendingIds((prev) => new Set(prev).add(id));
    const res = await fetch(`/api/notes/${id}/duplicate`, { method: "POST" });
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    if (!res.ok) {
      toast("Failed to duplicate note");
      return;
    }

    const copy = await res.json();
    setNotes((prev) =>
      sortNotes([
        {
          id: copy.id,
          title: copy.title,
          excerpt: copy.content?.slice(0, 200) ?? "",
          category: copy.category,
          status: copy.status,
          pinned: copy.pinned,
          updatedAt: copy.updatedAt,
        },
        ...prev,
      ]),
    );
    toast("Note duplicated");
  }

  async function deleteNote(id: string) {
    const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast("Failed to delete note");
      return;
    }
    setNotes((prev) => prev.filter((n) => n.id !== id));
    toast("Note deleted");
    setDeleteTarget(null);
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
      <header className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Notex</h1>
            <p className="text-sm text-zinc-500">Welcome, {userName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={toggleView}>
              {view === "list" ? "Board view" : "List view"}
            </Button>
            <ThemeToggle />
            <Button onClick={createNote}>New note</Button>
            <Button variant="secondary" onClick={() => signOut({ callbackUrl: "/login" })}>
              Logout
            </Button>
          </div>
        </div>
        <div className="mt-4 flex items-center rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700">
          <Search size={16} className="mr-2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes instantly..."
            className="w-full bg-transparent outline-none focus-visible:ring-0"
            aria-label="Search notes"
          />
          {searching ? <span className="text-xs text-zinc-400">Searching...</span> : null}
        </div>
      </header>

      {searching && filtered.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <NoteCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <p className="mb-3 text-zinc-600 dark:text-zinc-300">
            {query ? "No notes match your search." : "No notes yet."}
          </p>
          {!query ? <Button onClick={createNote}>Create your first note</Button> : null}
        </div>
      ) : view === "list" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              pending={pendingIds.has(note.id)}
              onPatch={patchNote}
              onDuplicate={duplicateNote}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      ) : (
        <NotesBoard
          notes={filtered}
          onStatusChange={(id, status) => void patchNote(id, { status })}
        />
      )}

      <DeleteDialog
        open={deleteTarget !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && void deleteNote(deleteTarget)}
      />
    </div>
  );
}

function NoteCard({
  note,
  pending,
  onPatch,
  onDuplicate,
  onDelete,
}: {
  note: NoteListItem;
  pending: boolean;
  onPatch: (id: string, payload: Partial<NoteListItem>, optimistic?: boolean) => Promise<void>;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <article
      className={cn(
        "rounded-xl border border-zinc-200 border-l-4 p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800",
        categoryMeta[note.category].cardClass,
        note.pinned && "ring-1 ring-zinc-300 dark:ring-zinc-600",
        pending && "opacity-70",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <Link href={`/notes/${note.id}`} className="truncate font-semibold hover:underline">
          {note.title}
        </Link>
        <div className="flex items-center gap-1">
          <button
            disabled={pending}
            onClick={() => void onPatch(note.id, { pinned: !note.pinned })}
            aria-label={note.pinned ? "Unpin note" : "Pin note"}
            className="rounded p-1 hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-400 dark:hover:bg-zinc-800"
          >
            <Pin size={16} className={note.pinned ? "fill-current text-zinc-700 dark:text-zinc-200" : ""} />
          </button>
          <button
            disabled={pending}
            onClick={() => onDuplicate(note.id)}
            aria-label="Duplicate note"
            className="rounded p-1 hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-400 dark:hover:bg-zinc-800"
          >
            <Copy size={16} />
          </button>
          <button
            disabled={pending}
            onClick={() => onDelete(note.id)}
            aria-label="Delete note"
            className="rounded p-1 hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-400 dark:hover:bg-zinc-800"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-300">
        {note.excerpt || "No content"}
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <select
          disabled={pending}
          value={note.category}
          onChange={(e) => void onPatch(note.id, { category: e.target.value as NoteCategory })}
          className="rounded border border-zinc-300 bg-transparent px-2 py-1 text-xs focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700"
          aria-label="Note category"
        >
          {Object.entries(categoryMeta).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <Badge className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {statusMeta[note.status].label}
          </Badge>
          <span className="text-xs text-zinc-500">{formatRelativeTime(note.updatedAt)}</span>
        </div>
      </div>
    </article>
  );
}
