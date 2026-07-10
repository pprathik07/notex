import { notFound } from "next/navigation";
import { NoteEditor } from "@/components/note-editor";
import { getNoteForUser } from "@/lib/notes-server";
import { auth, requireAuth } from "@/lib/auth";
import { serializeNote } from "@/lib/notes";

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await props.params;
  const note = session?.user?.id ? await getNoteForUser(session.user.id, id) : null;

  return {
    title: note ? `${note.title} | Notex` : "Note | Notex",
  };
}

export default async function NotePage(props: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  const { id } = await props.params;
  const note = await getNoteForUser(session.user.id, id);

  if (!note) {
    notFound();
  }

  return <NoteEditor key={id} noteId={id} initialNote={serializeNote(note)} />;
}
