import { auth } from "@/lib/auth";
import { NotesDashboard } from "@/components/notes-dashboard";
import { getNotesForUser } from "@/lib/notes-server";
import { serializeNoteListItem } from "@/lib/notes";

export default async function Home() {
  const session = await auth();
  const userId = session!.user!.id;
  const notes = await getNotesForUser(userId);

  return (
    <NotesDashboard
      initialNotes={notes.map(serializeNoteListItem)}
      userName={session!.user!.name ?? "there"}
    />
  );
}
