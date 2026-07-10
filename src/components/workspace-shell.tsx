"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import { Archive, FileText, Plus, Search, Star } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import type { NoteListItem } from "@/lib/notes";

type WorkspaceData = {
  allNotes: NoteListItem[];
  favorites: NoteListItem[];
  recent: NoteListItem[];
  archived: NoteListItem[];
};

type WorkspaceShellProps = {
  userName: string;
  children: React.ReactNode;
};

export function WorkspaceShell({ userName, children }: WorkspaceShellProps) {
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [query, setQuery] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  async function loadWorkspace() {
    setLoading(true);
    const res = await fetch("/api/workspace");
    if (res.ok) {
      const next = (await res.json()) as WorkspaceData;
      setData(next);
    }
    setLoading(false);
  }

  useEffect(() => {
    void loadWorkspace();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function createPage() {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled", position: data?.allNotes.length ?? 0 }),
    });
    if (!res.ok) return;
    const note = (await res.json()) as { id: string };
    await loadWorkspace();
    router.push(`/notes/${note.id}`);
  }

  const filtered = useMemo(() => {
    const source = data?.allNotes ?? [];
    const text = query.trim().toLowerCase();
    if (!text) return source.slice(0, 20);
    return source
      .filter((note) => note.title.toLowerCase().includes(text) || note.excerpt.toLowerCase().includes(text))
      .slice(0, 20);
  }, [data?.allNotes, query]);

  const navSections = [
    { key: "favorites", label: "Favorites", icon: Star, items: data?.favorites ?? [] },
    { key: "recent", label: "Recent", icon: FileText, items: data?.recent ?? [] },
    { key: "archived", label: "Archived", icon: Archive, items: data?.archived ?? [] },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <aside className="hidden w-72 shrink-0 border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:flex lg:flex-col">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Notex</h2>
            <p className="text-xs text-zinc-500">Hi, {userName}</p>
          </div>
          <ThemeToggle />
        </div>

        <div className="mb-4 flex items-center gap-2">
          <Button onClick={createPage} className="w-full">
            <Plus size={14} /> New page
          </Button>
          <Button variant="secondary" onClick={() => setCommandOpen(true)} className="px-2">
            <Search size={14} />
          </Button>
        </div>

        <div className="mb-3 rounded-md border border-zinc-200 px-2 py-1 dark:border-zinc-700">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter pages..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        <nav className="space-y-4 overflow-auto pb-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Pages</p>
            <div className="space-y-1">
              {(filtered.length > 0 ? filtered : data?.allNotes ?? []).map((note) => (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className={`block truncate rounded-md px-2 py-1 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                    pathname?.includes(note.id) ? "bg-zinc-100 dark:bg-zinc-800" : ""
                  }`}
                >
                  {note.title || "Untitled"}
                </Link>
              ))}
              {loading ? <p className="px-2 text-xs text-zinc-500">Loading...</p> : null}
            </div>
          </div>

          {navSections.map((section) => (
            <div key={section.key}>
              <p className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                <section.icon size={12} /> {section.label}
              </p>
              <div className="space-y-1">
                {section.items.length === 0 ? (
                  <p className="px-2 text-xs text-zinc-400">No pages</p>
                ) : (
                  section.items.map((note) => (
                    <Link
                      key={note.id}
                      href={`/notes/${note.id}`}
                      className="block truncate rounded-md px-2 py-1 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      {note.title || "Untitled"}
                    </Link>
                  ))
                )}
              </div>
            </div>
          ))}
        </nav>

        <Button variant="secondary" onClick={() => signOut({ callbackUrl: "/" })}>
          Logout
        </Button>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>

      {commandOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 pt-20" onClick={() => setCommandOpen(false)}>
          <div
            className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-2 text-sm font-medium">Quick Find (Ctrl/Cmd + K)</p>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages..."
              className="mb-3 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700"
            />
            <div className="max-h-72 space-y-1 overflow-auto">
              {filtered.map((note) => (
                <button
                  key={note.id}
                  onClick={() => {
                    setCommandOpen(false);
                    router.push(`/notes/${note.id}`);
                  }}
                  className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <span className="truncate">{note.title || "Untitled"}</span>
                  <span className="ml-2 text-xs text-zinc-500">{note.status}</span>
                </button>
              ))}
              {filtered.length === 0 ? <p className="px-2 py-4 text-xs text-zinc-500">No pages found.</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
