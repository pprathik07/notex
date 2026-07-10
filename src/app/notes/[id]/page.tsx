import { notFound } from "next/navigation";
import { NoteEditor } from "@/components/note-editor";
import { WorkspaceShell } from "@/components/workspace-shell";
import { ensureBlocksForNote, getNoteForUser } from "@/lib/notes-server";
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

  const rawBlocks = await ensureBlocksForNote(note.id, note.content);
  const serializedNote = serializeNote(note);
  const serializedBlocks = rawBlocks.map((block) => ({
    id: block.id,
    noteId: block.noteId,
    type: block.type,
    content: block.content,
    props: block.props ?? {},
    position: block.position,
    updatedAt: block.updatedAt.toISOString(),
    createdAt: block.createdAt?.toISOString(),
  }));

  return (
    <WorkspaceShell userName={session.user.name ?? "there"}>
      <NoteEditor
        key={id}
        noteId={id}
        initialNote={{ ...serializedNote, blocks: serializedBlocks } as any}
      />
    </WorkspaceShell>
  );
}
