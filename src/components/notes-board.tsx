"use client";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import Link from "next/link";
import { categoryMeta, statusMeta, type NoteStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { NoteListItem } from "@/lib/notes";

type NotesBoardProps = {
  notes: NoteListItem[];
  onStatusChange: (id: string, status: NoteStatus) => void;
};

export function NotesBoard({ notes, onStatusChange }: NotesBoardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function onDragEnd(event: DragEndEvent) {
    const id = event.active.id.toString();
    const status = event.over?.id as NoteStatus | undefined;
    if (!status || !statusMeta[status]) return;
    onStatusChange(id, status);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(statusMeta) as NoteStatus[]).map((status) => (
          <BoardColumn
            key={status}
            status={status}
            notes={notes.filter((note) => note.status === status)}
          />
        ))}
      </div>
    </DndContext>
  );
}

function BoardColumn({ status, notes }: { status: NoteStatus; notes: NoteListItem[] }) {
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "rounded-xl border bg-white p-3 dark:bg-zinc-900",
        isOver ? "border-zinc-500" : "border-zinc-200 dark:border-zinc-800",
      )}
    >
      <h2 className="mb-3 font-medium">{statusMeta[status].label}</h2>
      <div className="min-h-40 space-y-2">
        {notes.map((note) => (
          <DraggableCard key={note.id} note={note} />
        ))}
      </div>
    </section>
  );
}

function DraggableCard({ note }: { note: NoteListItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: note.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined }}
      className={cn(
        "rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-800",
        isDragging && "opacity-70",
        categoryMeta[note.category].cardClass,
        "border-l-4",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link href={`/notes/${note.id}`} className="text-left font-medium hover:underline">
          {note.title}
        </Link>
        <button className="cursor-grab text-zinc-500" {...listeners} {...attributes} aria-label="Drag note">
          ::
        </button>
      </div>
      <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{note.excerpt || "No content"}</p>
    </div>
  );
}
