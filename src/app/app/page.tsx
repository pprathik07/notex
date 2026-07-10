import { requireAuth } from "@/lib/auth";
import { NotesDashboard } from "@/components/notes-dashboard";
import { serializeNoteListItem } from "@/lib/notes";
import { getNotesForUser } from "@/lib/notes-server";

export default async function DashboardPage() {
  const session = await requireAuth();
  const notes = await getNotesForUser(session.user.id);

  return (
    <NotesDashboard
      initialNotes={notes.map(serializeNoteListItem)}
      userName={session.user.name ?? "there"}
    />
  );
}
