import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { noteBlocks, notes } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { serializeNote } from "@/lib/notes";
import { getBlocksForNote } from "@/lib/notes-server";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const source = await db.query.notes.findFirst({
    where: and(eq(notes.id, id), eq(notes.userId, session.user.id)),
  });

  if (!source) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date();
  const [copy] = await db
    .insert(notes)
    .values({
      userId: session.user.id,
      title: `${source.title} (copy)`,
      content: source.content,
      parentId: source.parentId,
      icon: source.icon,
      coverImage: source.coverImage,
      position: source.position + 1,
      category: source.category,
      status: source.status,
      pinned: false,
      isArchived: false,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const sourceBlocks = await getBlocksForNote(source.id);
  if (sourceBlocks.length > 0) {
    await db.insert(noteBlocks).values(
      sourceBlocks.map((block) => ({
        noteId: copy.id,
        type: block.type,
        content: block.content,
        props: block.props,
        position: block.position,
        createdAt: now,
        updatedAt: now,
      })),
    );
  }

  return NextResponse.json(serializeNote(copy), { status: 201 });
}
