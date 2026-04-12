import Link from "next/link";
import Image from "next/image";
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#5d4520,transparent_24%),linear-gradient(180deg,#060606_0%,#0b0906_42%,#020202_100%)] px-6 py-16 text-[#fff1cc]">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <section className="rounded-[2rem] border border-[#7d6230]/25 bg-[linear-gradient(180deg,rgba(17,17,17,0.96),rgba(8,8,8,0.94))] p-8 shadow-2xl shadow-black/50">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Image
                src="/logo.png"
                alt="AlphaLedger"
                width={600}
                height={600}
                priority
                className="h-[86px] w-[320px] object-contain object-left"
              />
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
                Email/password login and Google sign-in are now part of the app.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[#cbb995]">
                The stack uses Next.js App Router, Prisma, Neon Postgres, and
                Auth.js with credentials plus optional Google OAuth.
              </p>
            </div>

            {session?.user ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <p className="text-sm text-[#d9c59d]">You are signed in.</p>
                <SignOutButton />
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(90deg,#8b6122,#d5aa5e,#f0d289)] px-4 py-3 text-sm font-semibold text-[#140d05] transition hover:brightness-110"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-2xl border border-[#6f592d]/40 bg-[linear-gradient(180deg,rgba(22,22,22,0.95),rgba(8,8,8,0.96))] px-4 py-3 text-sm font-medium text-[#f3deb0] transition hover:border-[#9f7c3a]/55 hover:bg-[linear-gradient(180deg,rgba(28,28,28,0.96),rgba(10,10,10,0.98))]"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] border border-[#7d6230]/25 bg-[linear-gradient(180deg,rgba(17,17,17,0.96),rgba(8,8,8,0.94))] p-6">
            <h2 className="text-lg font-semibold">Session</h2>
            <div className="mt-5 space-y-3 text-sm text-[#e2d0aa]">
              <p>
                <span className="text-[#ab9567]">Status:</span>{" "}
                {session?.user ? "Authenticated" : "Guest"}
              </p>
              <p>
                <span className="text-[#ab9567]">User:</span>{" "}
                {session?.user?.email ?? "Not signed in"}
              </p>
              {session?.user?.role ? (
                <p>
                  <span className="text-[#ab9567]">Role:</span>{" "}
                  {session.user.role}
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#7d6230]/25 bg-[linear-gradient(180deg,rgba(17,17,17,0.96),rgba(8,8,8,0.94))] p-6">
            <h2 className="text-lg font-semibold">Database</h2>
            <div className="mt-5 space-y-3 text-sm text-[#e2d0aa]">
              <p>
                <span className="text-[#ab9567]">Status:</span>{" "}
                {dbStatus.connected ? "Connected" : "Connection error"}
              </p>
              {dbStatus.checkedAt ? (
                <p>
                  <span className="text-[#ab9567]">Checked:</span>{" "}
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
