export const categoryMeta = {
  personal: {
    label: "Personal",
    cardClass:
      "border-l-zinc-400 bg-zinc-50/70 dark:border-l-zinc-500 dark:bg-zinc-900/80",
  },
  work: {
    label: "Work",
    cardClass:
      "border-l-emerald-500 bg-emerald-50/60 dark:border-l-emerald-500 dark:bg-emerald-950/25",
  },
  ideas: {
    label: "Ideas",
    cardClass:
      "border-l-cyan-500 bg-cyan-50/60 dark:border-l-cyan-500 dark:bg-cyan-950/25",
  },
  other: {
    label: "Other",
    cardClass:
      "border-l-stone-400 bg-stone-50/70 dark:border-l-stone-500 dark:bg-stone-900/70",
  },
} as const;

export const statusMeta = {
  todo: { label: "To-Do" },
  in_progress: { label: "In Progress" },
  done: { label: "Done" },
} as const;

export type NoteCategory = keyof typeof categoryMeta;
export type NoteStatus = keyof typeof statusMeta;
