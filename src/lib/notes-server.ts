import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { noteBlocks, notes } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { NOTE_EXCERPT_LENGTH } from "@/lib/notes";

const listColumns = {
  id: notes.id,
  title: notes.title,
  excerpt: sql<string>`left(${notes.content}, ${NOTE_EXCERPT_LENGTH})`.as("excerpt"),
  parentId: notes.parentId,
  position: notes.position,
  category: notes.category,
  status: notes.status,
  pinned: notes.pinned,
  isArchived: notes.isArchived,
  isFavorite: notes.isFavorite,
  updatedAt: notes.updatedAt,
};

const legacyListColumns = {
  id: notes.id,
  title: notes.title,
  excerpt: sql<string>`left(${notes.content}, ${NOTE_EXCERPT_LENGTH})`.as("excerpt"),
  category: notes.category,
  status: notes.status,
  pinned: notes.pinned,
  updatedAt: notes.updatedAt,
};

function isMissingColumnError(err: unknown) {
  // postgres.js errors expose `code` (e.g. 42703 = undefined_column)
  return typeof err === "object" && err !== null && "code" in err && (err as any).code === "42703";
}

export async function getNotesForUser(userId: string, query?: string, includeArchived = false) {
  const whereWithArchived = query?.trim()
    ? and(
        eq(notes.userId, userId),
        includeArchived ? undefined : eq(notes.isArchived, false),
        or(ilike(notes.title, `%${query.trim()}%`), ilike(notes.content, `%${query.trim()}%`)),
      )
    : and(eq(notes.userId, userId), includeArchived ? undefined : eq(notes.isArchived, false));

  try {
    return await db
      .select(listColumns)
      .from(notes)
      .where(whereWithArchived)
      .orderBy(desc(notes.pinned), asc(notes.position), desc(notes.updatedAt));
  } catch (err) {
    if (!isMissingColumnError(err)) throw err;

    // Backward-compat fallback for DBs that haven't been migrated yet.
    const legacyWhere = query?.trim()
      ? and(
          eq(notes.userId, userId),
          or(ilike(notes.title, `%${query.trim()}%`), ilike(notes.content, `%${query.trim()}%`)),
        )
      : eq(notes.userId, userId);

    const rows = await db
      .select(legacyListColumns)
      .from(notes)
      .where(legacyWhere)
      .orderBy(desc(notes.pinned), desc(notes.updatedAt));

    return rows.map((row) => ({
      ...row,
      parentId: null,
      position: 0,
      isArchived: false,
      isFavorite: false,
    })) as any;
  }
}

export async function getNoteForUser(userId: string, noteId: string) {
  return db.query.notes.findFirst({
    where: and(eq(notes.id, noteId), eq(notes.userId, userId)),
  });
}

export async function getWorkspaceSections(userId: string) {
  try {
    const [allNotes, favorites, archived, recent] = await Promise.all([
      db
        .select(listColumns)
        .from(notes)
        .where(and(eq(notes.userId, userId), eq(notes.isArchived, false)))
        .orderBy(asc(notes.position), desc(notes.updatedAt)),
      db
        .select(listColumns)
        .from(notes)
        .where(and(eq(notes.userId, userId), eq(notes.isArchived, false), eq(notes.isFavorite, true)))
        .orderBy(desc(notes.updatedAt))
        .limit(20),
      db
        .select(listColumns)
        .from(notes)
        .where(and(eq(notes.userId, userId), eq(notes.isArchived, true)))
        .orderBy(desc(notes.updatedAt))
        .limit(20),
      db
        .select(listColumns)
        .from(notes)
        .where(and(eq(notes.userId, userId), eq(notes.isArchived, false)))
        .orderBy(desc(notes.updatedAt))
        .limit(20),
    ]);

    return { allNotes, favorites, archived, recent };
  } catch (err) {
    if (!isMissingColumnError(err)) throw err;

    // Legacy DB: no favorites/archived columns exist yet.
    const allNotes = await db
      .select(legacyListColumns)
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.pinned), desc(notes.updatedAt));

    const withDefaults = allNotes.map((row) => ({
      ...row,
      parentId: null,
      position: 0,
      isArchived: false,
      isFavorite: false,
    })) as any;

    return { allNotes: withDefaults, favorites: [], archived: [], recent: withDefaults.slice(0, 20) };
  }
}

export async function getBlocksForNote(noteId: string) {
  return db
    .select()
    .from(noteBlocks)
    .where(eq(noteBlocks.noteId, noteId))
    .orderBy(asc(noteBlocks.position));
}

export async function ensureBlocksForNote(noteId: string, fallbackContent: string) {
  const existingBlocks = await getBlocksForNote(noteId);
  if (existingBlocks.length > 0) {
    return existingBlocks;
  }

  const contentParts = fallbackContent
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);
  const initialContent = contentParts.length > 0 ? contentParts : [fallbackContent || ""];

  if (initialContent.length === 0) {
    return [];
  }

  await db.insert(noteBlocks).values(
    initialContent.map((content, index) => ({
      noteId,
      type: "paragraph" as any,
      content,
      props: {},
      position: index,
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as any,
  );

  return getBlocksForNote(noteId);
}

export async function reorderBlocks(noteId: string, orderedIds: string[]) {
  if (orderedIds.length === 0) return;
  const now = new Date();

  await Promise.all(
    orderedIds.map((id, index) =>
      db
        .update(noteBlocks)
        .set({ position: index, updatedAt: now })
        .where(and(eq(noteBlocks.id, id), eq(noteBlocks.noteId, noteId))),
    ),
  );
}

export async function deleteMissingBlocks(noteId: string, remainingIds: string[]) {
  const blocks = await getBlocksForNote(noteId);
  const remainingSet = new Set(remainingIds);
  const toDelete = blocks.map((block) => block.id).filter((id) => !remainingSet.has(id));
  if (toDelete.length === 0) return;

  await db.delete(noteBlocks).where(inArray(noteBlocks.id, toDelete));
}
