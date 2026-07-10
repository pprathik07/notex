import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const highlights = [
  "Lightning-fast notes and search",
  "List + Kanban view for daily planning",
  "Secure sign-in with your own workspace",
  "Markdown editor with live preview",
];

export default async function HomePage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/app");
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-16 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-12">
        <div className="space-y-4">
          <p className="inline-flex rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
            Notex
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
            Your focused notes workspace for ideas, tasks, and team docs.
          </h1>
          <p className="max-w-2xl text-base text-zinc-600 dark:text-zinc-300">
            Capture quickly, organize with status and categories, and keep every note easy to find.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Sign In
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {highlights.map((item) => (
            <div
              key={item}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
