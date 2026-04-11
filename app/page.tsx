import Link from "next/link";
import { connection } from "next/server";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { prisma } from "@/lib/prisma";

type DbCheckResult = {
  connected: boolean;
  checkedAt?: string;
  error?: string;
};

async function checkDatabase(): Promise<DbCheckResult> {
  try {
    const result = await prisma.$queryRaw<Array<{ checked_at: Date }>>`
      SELECT NOW() AS checked_at
    `;

    return {
      connected: true,
      checkedAt: result[0]?.checked_at.toISOString(),
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }
}

export default async function Home() {
  await connection();
  const session = await auth();
  const dbStatus = await checkDatabase();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#134e4a,transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_45%,#111827_100%)] px-6 py-16 text-zinc-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">
                Tradex Auth
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
                Email/password login and Google sign-in are now part of the app.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
                The stack uses Next.js App Router, Prisma, Neon Postgres, and
                Auth.js with credentials plus optional Google OAuth.
              </p>
            </div>

            {session?.user ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
                >
                  Open Dashboard
                </Link>
                <SignOutButton />
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-2xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-6">
            <h2 className="text-lg font-semibold">Session</h2>
            <div className="mt-5 space-y-3 text-sm text-zinc-300">
              <p>
                <span className="text-zinc-500">Status:</span>{" "}
                {session?.user ? "Authenticated" : "Guest"}
              </p>
              <p>
                <span className="text-zinc-500">User:</span>{" "}
                {session?.user?.email ?? "Not signed in"}
              </p>
              {session?.user?.role ? (
                <p>
                  <span className="text-zinc-500">Role:</span>{" "}
                  {session.user.role}
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-6">
            <h2 className="text-lg font-semibold">Database</h2>
            <div className="mt-5 space-y-3 text-sm text-zinc-300">
              <p>
                <span className="text-zinc-500">Status:</span>{" "}
                {dbStatus.connected ? "Connected" : "Connection error"}
              </p>
              {dbStatus.checkedAt ? (
                <p>
                  <span className="text-zinc-500">Checked:</span>{" "}
                  {new Date(dbStatus.checkedAt).toLocaleString("en-US")}
                </p>
              ) : null}
              {dbStatus.error ? (
                <p className="text-red-300">{dbStatus.error}</p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
