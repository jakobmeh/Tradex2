import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      accounts: {
        select: {
          provider: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#020617_0%,#111827_100%)] px-6 py-16 text-zinc-50">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">
                Dashboard
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight">
                Welcome{user.name ? `, ${user.name}` : ""}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                Your account is active. This page is protected on the server and
                only renders for authenticated users.
              </p>
            </div>

            <SignOutButton />
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-6">
            <h2 className="text-lg font-semibold">Account</h2>
            <dl className="mt-5 space-y-3 text-sm text-zinc-300">
              <div>
                <dt className="text-zinc-500">Email</dt>
                <dd>{user.email ?? "No email"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Role</dt>
                <dd>{user.role}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Created</dt>
                <dd>{user.createdAt.toLocaleString("en-US")}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-6">
            <h2 className="text-lg font-semibold">Connected Providers</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-300">
                credentials
              </span>
              {user.accounts.map((account: { provider: string }) => (
                <span
                  key={`${account.provider}-${user.id}`}
                  className="rounded-full bg-sky-500/15 px-3 py-1 text-sm text-sky-300"
                >
                  {account.provider}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
