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

const features = [
  {
    icon: "✦",
    title: "Pages & Blocks",
    description:
      "Build rich documents with a flexible block editor. Headings, text, embeds, and more — all in one place.",
  },
  {
    icon: "⊞",
    title: "Databases",
    description:
      "Organize any kind of data with powerful databases. Filter, sort, and view your entries exactly how you need.",
  },
  {
    icon: "◈",
    title: "AI Assistant",
    description:
      "Ask questions about your pages, generate tables, and let AI do the heavy lifting for you.",
  },
  {
    icon: "◎",
    title: "Workspaces",
    description:
      "Collaborate with your team in shared workspaces. Invite members and work together seamlessly.",
  },
  {
    icon: "⌕",
    title: "Search",
    description:
      "Find anything instantly across all your pages and databases with full-text search.",
  },
  {
    icon: "⟳",
    title: "Trash & Recovery",
    description:
      "Accidentally deleted something? Recover it from the trash at any time.",
  },
];

export default async function Home() {
  await connection();
  const session = await auth();
  const dbStatus = await checkDatabase();

  return (
    <main className="min-h-screen bg-[#080706] text-[#f0ddb8]">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[#7d5c1e] opacity-[0.07] blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 h-[400px] w-[600px] rounded-full bg-[#4a3a14] opacity-[0.05] blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pt-6 pb-20">
        {/* Nav */}
        <nav className="mb-20 flex items-center justify-between">
          <Image
            src="/logo.png"
            alt="AlphaLedger"
            width={600}
            height={600}
            priority
            className="h-[128px] w-auto object-contain"
          />
          <div className="flex items-center gap-3">
            {session?.user ? (
              <>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-xl bg-[linear-gradient(90deg,#8b6122,#d5aa5e,#f0d289)] px-5 py-2.5 text-sm font-semibold text-[#140d05] transition hover:brightness-110"
                >
                  Dashboard
                </Link>
                <SignOutButton />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl border border-[#6f592d]/40 px-5 py-2.5 text-sm font-medium text-[#e8d09a] transition hover:border-[#9f7c3a]/60 hover:text-[#f5e4b8]"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-xl bg-[linear-gradient(90deg,#8b6122,#d5aa5e,#f0d289)] px-5 py-2.5 text-sm font-semibold text-[#140d05] transition hover:brightness-110"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Hero */}
        <section className="mb-28 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#7d6230]/30 bg-[#0f0e0c] px-4 py-1.5 text-xs font-medium text-[#c9a55e]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d4a84b]" />
            Your all-in-one workspace
          </div>
          <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-[1.15] tracking-tight text-[#f5e8cc] md:text-6xl">
            Think, plan, and build —{" "}
            <span className="bg-[linear-gradient(90deg,#c9973a,#f0d289,#c9973a)] bg-clip-text text-transparent">
              together
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-[#a89270]">
            AlphaLedger brings your notes, databases, and AI tools into one
            clean workspace. Start writing, organizing, and collaborating in
            seconds.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {session?.user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(90deg,#8b6122,#d5aa5e,#f0d289)] px-7 py-3.5 text-sm font-semibold text-[#140d05] shadow-lg shadow-[#8b6122]/20 transition hover:brightness-110"
              >
                Open Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(90deg,#8b6122,#d5aa5e,#f0d289)] px-7 py-3.5 text-sm font-semibold text-[#140d05] shadow-lg shadow-[#8b6122]/20 transition hover:brightness-110"
                >
                  Start for free →
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl border border-[#6f592d]/35 bg-[#0f0e0c] px-7 py-3.5 text-sm font-medium text-[#e8d09a] transition hover:border-[#9f7c3a]/55"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Features */}
        <section className="mb-28">
          <h2 className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-[#8a7050]">
            Everything you need
          </h2>
          <p className="mb-12 text-center text-2xl font-semibold text-[#f0ddb8]">
            One workspace for all your work
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-[#2a2318] bg-[linear-gradient(160deg,#141210,#0d0c0a)] p-6 transition hover:border-[#7d6230]/40 hover:bg-[linear-gradient(160deg,#181510,#100e0c)]"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-[#4a3a18]/60 bg-[#181410] text-lg text-[#d4a84b]">
                  {f.icon}
                </div>
                <h3 className="mb-2 text-sm font-semibold text-[#f0ddb8]">
                  {f.title}
                </h3>
                <p className="text-sm leading-6 text-[#8a7a5a]">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA banner */}
        {!session?.user && (
          <section className="mb-28 overflow-hidden rounded-3xl border border-[#7d6230]/20 bg-[linear-gradient(135deg,#0f0d0a,#1a1508,#0f0d0a)] p-px">
            <div className="rounded-3xl bg-[linear-gradient(135deg,#141210,#0e0c09)] px-10 py-14 text-center">
              <h2 className="mb-4 text-3xl font-bold text-[#f5e8cc]">
                Ready to get started?
              </h2>
              <p className="mx-auto mb-8 max-w-md text-sm leading-7 text-[#a89270]">
                Create your free account and explore everything AlphaLedger has
                to offer. No credit card required.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(90deg,#8b6122,#d5aa5e,#f0d289)] px-8 py-3.5 text-sm font-semibold text-[#140d05] shadow-lg shadow-[#8b6122]/20 transition hover:brightness-110"
              >
                Create free account
              </Link>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="flex flex-col items-center justify-between gap-4 border-t border-[#1e1a12] pt-8 text-xs text-[#5a4e38] sm:flex-row">
          <div className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${dbStatus.connected ? "bg-emerald-500" : "bg-red-500"}`}
            />
            <span>
              Database: {dbStatus.connected ? "Connected" : "Disconnected"}
            </span>
          </div>
          {session?.user && (
            <span className="text-[#6a5c3e]">
              Signed in as{" "}
              <span className="text-[#8a7050]">{session.user.email}</span>
            </span>
          )}
          <span>© {new Date().getFullYear()} AlphaLedger</span>
        </footer>
      </div>
    </main>
  );
}
