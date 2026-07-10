import { NextResponse } from "next/server";
import { z } from "zod";
import { notes } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getNotesForUser } from "@/lib/notes-server";
import { serializeNote, serializeNoteListItem } from "@/lib/notes";

const createSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  category: z.enum(["personal", "work", "ideas", "other"]).optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const data = await getNotesForUser(session.user.id, q);

  return NextResponse.json(data.map(serializeNoteListItem));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const now = new Date();
  const [note] = await db
    .insert(notes)
    .values({
      userId: session.user.id,
      title: parsed.data.title ?? "Untitled",
      content: parsed.data.content ?? "",
      category: parsed.data.category ?? "other",
      status: parsed.data.status ?? "todo",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json(serializeNote(note), { status: 201 });
}
