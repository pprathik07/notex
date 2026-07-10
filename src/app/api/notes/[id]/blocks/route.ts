import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { noteBlocks, notes } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureBlocksForNote } from "@/lib/notes-server";

const blockTypeSchema = z.enum([
  "paragraph",
  "heading1",
  "heading2",
  "heading3",
  "bulleted_list",
  "numbered_list",
  "todo",
  "quote",
  "code",
]);

const blockSchema = z.object({
  id: z.string().uuid().optional(),
  type: blockTypeSchema,
  content: z.string(),
  props: z.record(z.string(), z.unknown()).optional(),
  position: z.number().int().min(0),
});

const blocksPayloadSchema = z.object({
  blocks: z.array(blockSchema),
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
  return NextResponse.json(blocks);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
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

  const payload = await request.json().catch(() => ({}));
  const parsed = blocksPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const now = new Date();
  await db.delete(noteBlocks).where(eq(noteBlocks.noteId, note.id));
  if (parsed.data.blocks.length > 0) {
    await db.insert(noteBlocks).values(
      parsed.data.blocks.map((block) => ({
        noteId: note.id,
        type: block.type,
        content: block.content,
        props: block.props ?? {},
        position: block.position,
        createdAt: now,
        updatedAt: now,
      })),
    );
  }

  await db
    .update(notes)
    .set({
      content: parsed.data.blocks.map((block) => block.content).join("\n"),
      updatedAt: now,
    })
    .where(eq(notes.id, note.id));

  const blocks = await ensureBlocksForNote(note.id, note.content);
  return NextResponse.json(blocks);
}
