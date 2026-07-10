import type { NoteCategory, NoteStatus } from "@/lib/constants";

export type Note = {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  status: NoteStatus;
  pinned: boolean;
  updatedAt: string;
  createdAt?: string;
};

export type NoteListItem = {
  id: string;
  title: string;
  excerpt: string;
  category: NoteCategory;
  status: NoteStatus;
  pinned: boolean;
  updatedAt: string;
};

export const NOTE_EXCERPT_LENGTH = 200;

export function toExcerpt(content: string) {
  return content.slice(0, NOTE_EXCERPT_LENGTH);
}

export function sortNotes<T extends { pinned: boolean; updatedAt: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function serializeNote<T extends { updatedAt: Date; createdAt?: Date }>(note: T) {
  return {
    ...note,
    updatedAt: note.updatedAt.toISOString(),
    createdAt: note.createdAt?.toISOString(),
  };
}

export function serializeNoteListItem(note: {
  id: string;
  title: string;
  category: NoteCategory;
  status: NoteStatus;
  pinned: boolean;
  updatedAt: Date;
  excerpt?: string;
  content?: string;
}): NoteListItem {
  return {
    id: note.id,
    title: note.title,
    category: note.category,
    status: note.status,
    pinned: note.pinned,
    excerpt: note.excerpt ?? toExcerpt(note.content ?? ""),
    updatedAt: note.updatedAt.toISOString(),
  };
}
