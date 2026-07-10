import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { notes } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { NOTE_EXCERPT_LENGTH } from "@/lib/notes";

const listColumns = {
  id: notes.id,
  title: notes.title,
  excerpt: sql<string>`left(${notes.content}, ${NOTE_EXCERPT_LENGTH})`.as("excerpt"),
  category: notes.category,
  status: notes.status,
  pinned: notes.pinned,
  updatedAt: notes.updatedAt,
};

export async function getNotesForUser(userId: string, query?: string) {
  const baseWhere = query?.trim()
    ? and(
        eq(notes.userId, userId),
        or(ilike(notes.title, `%${query.trim()}%`), ilike(notes.content, `%${query.trim()}%`)),
      )
    : eq(notes.userId, userId);

  return db
    .select(listColumns)
    .from(notes)
    .where(baseWhere)
    .orderBy(desc(notes.pinned), desc(notes.updatedAt));
}

export async function getNoteForUser(userId: string, noteId: string) {
  return db.query.notes.findFirst({
    where: and(eq(notes.id, noteId), eq(notes.userId, userId)),
  });
}
