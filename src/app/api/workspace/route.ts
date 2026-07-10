import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWorkspaceSections } from "@/lib/notes-server";
import { serializeNoteListItem } from "@/lib/notes";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sections = await getWorkspaceSections(session.user.id);
  return NextResponse.json({
    allNotes: sections.allNotes.map(serializeNoteListItem),
    favorites: sections.favorites.map(serializeNoteListItem),
    archived: sections.archived.map(serializeNoteListItem),
    recent: sections.recent.map(serializeNoteListItem),
  });
}
