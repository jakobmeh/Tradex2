import { getCurrentWorkspace } from '@/lib/workspace'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export default async function DashboardPage() {
  const workspace = await getCurrentWorkspace()
  const session = await auth()

  const [recentPages, friendCount, unreadCount] = await Promise.all([
    prisma.page.findMany({
      where: { workspaceId: workspace.id, isDeleted: false },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    }),
    session?.user?.id ? prisma.friendship.count({
      where: {
        status: 'accepted',
        OR: [{ senderId: session.user.id }, { receiverId: session.user.id }],
      },
    }) : Promise.resolve(0),
    session?.user?.id ? prisma.directMessage.count({
      where: { receiverId: session.user.id, read: false },
    }) : Promise.resolve(0),
  ])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const todayEdited = recentPages.filter(p => {
    const today = new Date()
    const u = new Date(p.updatedAt)
    return u.getDate() === today.getDate() && u.getMonth() === today.getMonth()
  }).length

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">

      {/* Hero */}
      <div className="rounded-2xl border border-[#6f592d]/20 bg-[linear-gradient(135deg,rgba(20,18,12,0.95),rgba(10,9,6,0.98))] p-6 md:p-10">
        <p className="text-[11px] uppercase tracking-[0.34em] text-[#b99652]/60">
          {workspace.icon ?? '🏠'} {workspace.name}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
          {greeting}{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500 sm:text-base">
          Welcome back to your trading workspace.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/community/new" className="rounded-xl bg-[linear-gradient(90deg,#8b6122,#d5aa5e,#f0d289)] px-5 py-2 text-xs font-semibold text-[#140d05] shadow-[0_8px_24px_rgba(169,124,40,0.25)] transition hover:brightness-110">
            + Share trade
          </Link>
          <Link href="/community" className="rounded-xl border border-[#6f592d]/30 px-5 py-2 text-xs text-[#b99652] transition hover:border-[#9f7c3a]/50 hover:text-[#f0d289]">
            Browse community
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Pages', value: workspace.pages.length, icon: '📄', href: null },
          { label: 'Edited today', value: todayEdited, icon: '✏️', href: null },
          { label: 'Friends', value: friendCount, icon: '👥', href: '/dashboard/friends' },
          { label: 'Unread', value: unreadCount, icon: '💬', href: '/dashboard/messages' },
        ].map(stat => (
          stat.href ? (
            <Link key={stat.label} href={stat.href} className="group rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 transition hover:border-[#6f592d]/40 hover:bg-zinc-900">
              <p className="text-xl">{stat.icon}</p>
              <p className="mt-3 text-2xl font-semibold text-white">{stat.value}</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-widest text-zinc-500 group-hover:text-[#b99652] transition">{stat.label}</p>
            </Link>
          ) : (
            <div key={stat.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
              <p className="text-xl">{stat.icon}</p>
              <p className="mt-3 text-2xl font-semibold text-white">{stat.value}</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-widest text-zinc-500">{stat.label}</p>
            </div>
          )
        ))}
      </div>

      {/* Main grid */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">

        {/* Recent pages */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-zinc-500">Recently edited</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Pages</h2>
            </div>
            <Link href="/dashboard/search" className="text-xs text-[#b99652] transition hover:text-[#f0d289]">
              Search →
            </Link>
          </div>
          {recentPages.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {recentPages.map(page => (
                <Link key={page.id} href={`/dashboard/pages/${page.id}`}
                  className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3 transition hover:border-zinc-700 hover:bg-[#0e0c08]">
                  <span className="mt-0.5 text-lg shrink-0">{page.icon ?? '📄'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-100">{page.title || 'Untitled'}</p>
                    <p className="mt-0.5 text-xs text-zinc-600">
                      {new Date(page.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-800 py-10 text-center text-sm text-zinc-600">
              No pages yet — create one from the sidebar
            </div>
          )}
        </section>

        {/* Quick actions */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-widest text-zinc-500">Navigate</p>
          <h2 className="mt-1 mb-4 text-lg font-semibold text-white">Quick actions</h2>
          <div className="space-y-2">
            {[
              { href: '/dashboard/friends', icon: '👥', label: 'Friends', sub: 'Manage connections' },
              { href: '/dashboard/messages', icon: '💬', label: 'Messages', sub: unreadCount > 0 ? `${unreadCount} unread` : 'Direct messages', highlight: unreadCount > 0 },
              { href: '/community', icon: '🌍', label: 'Community', sub: 'Browse trades' },
              { href: '/dashboard/search', icon: '🔍', label: 'Search', sub: 'Find pages & databases' },
              { href: '/dashboard/settings', icon: '⚙️', label: 'Settings', sub: 'Workspace settings' },
              { href: '/dashboard/trash', icon: '🗑️', label: 'Trash', sub: 'Deleted pages' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 transition hover:border-[#6f592d]/40 hover:bg-[#0e0c08]">
                <span className="text-base">{item.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-200">{item.label}</p>
                  <p className={`text-xs ${item.highlight ? 'text-[#f0d289]' : 'text-zinc-600'}`}>{item.sub}</p>
                </div>
                <span className="text-zinc-700 text-xs">→</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
