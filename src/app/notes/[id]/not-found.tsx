import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NoteNotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center p-8 text-center">
      <h1 className="text-2xl font-semibold">Note not found</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        This note may have been deleted or you do not have access to it.
      </p>
      <Link href="/">
        <Button className="mt-6">Back to dashboard</Button>
      </Link>
    </div>
  );
}
