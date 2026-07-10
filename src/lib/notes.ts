import type { NoteCategory, NoteStatus } from "@/lib/constants";

export type NoteBlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "bulleted_list"
  | "numbered_list"
  | "todo"
  | "quote"
  | "code";

export type NoteBlock = {
  id: string;
  noteId: string;
  type: NoteBlockType;
  content: string;
  props: Record<string, unknown>;
  position: number;
  updatedAt: string;
  createdAt?: string;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  parentId?: string | null;
  icon?: string | null;
  coverImage?: string | null;
  position: number;
  category: NoteCategory;
  status: NoteStatus;
  pinned: boolean;
  isArchived: boolean;
  isFavorite: boolean;
  blocks?: NoteBlock[];
  updatedAt: string;
  createdAt?: string;
};

export type NoteListItem = {
  id: string;
  title: string;
  excerpt: string;
  parentId?: string | null;
  position: number;
  category: NoteCategory;
  status: NoteStatus;
  pinned: boolean;
  isArchived: boolean;
  isFavorite: boolean;
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
  const maybeBlocks = (note as T & { blocks?: Array<{ updatedAt: Date; createdAt?: Date }> }).blocks;

  return {
    ...note,
    blocks: maybeBlocks?.map((block) => ({
      ...block,
      updatedAt: block.updatedAt.toISOString(),
      createdAt: block.createdAt?.toISOString(),
    })),
    updatedAt: note.updatedAt.toISOString(),
    createdAt: note.createdAt?.toISOString(),
  };
}

export function serializeNoteListItem(note: {
  id: string;
  title: string;
  parentId?: string | null;
  position?: number;
  category: NoteCategory;
  status: NoteStatus;
  pinned: boolean;
  isArchived?: boolean;
  isFavorite?: boolean;
  updatedAt: Date;
  excerpt?: string;
  content?: string;
}): NoteListItem {
  return {
    id: note.id,
    title: note.title,
    parentId: note.parentId ?? null,
    position: note.position ?? 0,
    category: note.category,
    status: note.status,
    pinned: note.pinned,
    isArchived: note.isArchived ?? false,
    isFavorite: note.isFavorite ?? false,
    excerpt: note.excerpt ?? toExcerpt(note.content ?? ""),
    updatedAt: note.updatedAt.toISOString(),
  };
}
