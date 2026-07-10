import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Login | Notex",
  description: "Sign in to your Notex workspace",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginForm />
        <p className="mt-4 text-center text-sm text-zinc-500">
          New user?{" "}
          <Link href="/register" className="text-zinc-900 underline dark:text-zinc-100">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
