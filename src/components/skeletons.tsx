import { cn } from "@/lib/utils";

export function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
      <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="h-7 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-4 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-9 w-20 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
            ))}
          </div>
        </div>
        <div className="mt-4 h-10 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <NoteCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function NoteCardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="mb-3 h-5 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 w-4/6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>
    </div>
  );
}

export function BoardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
          <div className="mb-3 h-5 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="h-16 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function EditorSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
      <div className="mb-4 h-5 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="min-h-[70vh] animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
        <div className="min-h-[70vh] animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
      </div>
    </div>
  );
}

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}
