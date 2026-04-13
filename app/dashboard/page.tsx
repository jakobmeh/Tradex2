import { getCurrentWorkspace } from '@/lib/workspace'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export default async function DashboardPage() {
  const workspace = await getCurrentWorkspace()
  const session = await auth()

  const recentPages = await prisma.page.findMany({
    where: { workspaceId: workspace.id, isDeleted: false },
    orderBy: { updatedAt: 'desc' },
    take: 6,
  })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const stats = [
    { label: 'Pages', value: workspace.pages.length, icon: '\ud83d\udcc4' },
    { label: 'Databases', value: workspace.databases.length, icon: '\ud83d\uddc4\ufe0f' },
    {
      label: 'Updated today',
      value: recentPages.filter((page) => {
        const today = new Date()
        const updated = new Date(page.updatedAt)
        return updated.getDate() === today.getDate() && updated.getMonth() === today.getMonth()
      }).length,
      icon: '\u270f\ufe0f',
    },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
      <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur md:p-8 lg:p-10">
          <p className="text-xs uppercase tracking-[0.34em] text-zinc-500">
            {workspace.icon ?? 'A'} {workspace.name}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
            {greeting}
            {session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
            Your workspace overview, recent activity, and quick actions in a dedicated dashboard atmosphere.
          </p>
        </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[1.4rem] border border-zinc-800 bg-zinc-900/80 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.32)] backdrop-blur"
            >
              <p className="text-2xl">{stat.icon}</p>
              <p className="mt-4 text-3xl font-semibold text-white">{stat.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.24em] text-zinc-500">{stat.label}</p>
            </div>
          ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[1.8rem] border border-zinc-800 bg-zinc-900/80 p-6 shadow-[0_25px_70px_rgba(0,0,0,0.34)] backdrop-blur">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Recently edited</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Recent pages</h2>
              </div>
            </div>

            {recentPages.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {recentPages.map((page) => (
                  <Link
                    key={page.id}
                    href={`/dashboard/pages/${page.id}`}
                    className="group rounded-[1.2rem] border border-zinc-800 bg-zinc-900 px-4 py-4 transition hover:border-zinc-700 hover:bg-zinc-900/90"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{page.icon ?? '\ud83d\udcc4'}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{page.title || 'Untitled'}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {new Date(page.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.2rem] border border-dashed border-zinc-800 px-5 py-10 text-center text-sm text-zinc-500">
                No pages edited yet.
              </div>
            )}
          </section>

          <section className="rounded-[1.8rem] border border-zinc-800 bg-zinc-900/80 p-6 shadow-[0_25px_70px_rgba(0,0,0,0.34)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Quick actions</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Move faster</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-400">
              Jump directly into search or create fresh workspace content.
            </p>

            <div className="mt-6 space-y-3">
              <Link
                href="/dashboard/search"
                className="flex items-center justify-between rounded-[1.2rem] border border-zinc-800 bg-zinc-900 px-4 py-4 text-sm text-zinc-100 transition hover:border-zinc-700 hover:text-white"
              >
                <span>Search workspace</span>
                <span className="text-xs text-zinc-500">\u2318K</span>
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex items-center justify-between rounded-[1.2rem] border border-zinc-800 bg-zinc-900 px-4 py-4 text-sm text-zinc-100 transition hover:border-zinc-700 hover:text-white"
              >
                <span>Open settings</span>
                <span className="text-xs text-zinc-500">\u2192</span>
              </Link>
              <Link
                href="/dashboard/trash"
                className="flex items-center justify-between rounded-[1.2rem] border border-zinc-800 bg-zinc-900 px-4 py-4 text-sm text-zinc-100 transition hover:border-zinc-700 hover:text-white"
              >
                <span>Review trash</span>
                <span className="text-xs text-zinc-500">\u2192</span>
              </Link>
            </div>
        </section>
      </div>
    </div>
  )
}
