import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { notes } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { serializeNote } from "@/lib/notes";

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
      category: source.category,
      status: source.status,
      pinned: false,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json(serializeNote(copy), { status: 201 });
}
