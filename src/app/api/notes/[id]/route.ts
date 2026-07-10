import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { notes } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { serializeNote } from "@/lib/notes";
import { ensureBlocksForNote } from "@/lib/notes-server";

const updateSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  parentId: z.string().uuid().nullable().optional(),
  icon: z.string().max(16).nullable().optional(),
  coverImage: z.string().url().nullable().optional(),
  position: z.number().int().min(0).optional(),
  category: z.enum(["personal", "work", "ideas", "other"]).optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  pinned: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

async function getUserId() {
  const session = await auth();
  return session?.user?.id;
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const note = await db.query.notes.findFirst({
    where: and(eq(notes.id, id), eq(notes.userId, userId)),
  });

  if (!note) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const blocks = await ensureBlocksForNote(note.id, note.content);
  return NextResponse.json(serializeNote({ ...note, blocks }));
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const payload = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const [updated] = await db
    .update(notes)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(serializeNote(updated));
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const [deleted] = await db
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning({ id: notes.id });

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
