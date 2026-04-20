import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AdminPanel from '@/components/admin/AdminPanel'

export const revalidate = 0

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (user?.role !== 'admin') redirect('/dashboard')

  const [posts, users, stats] = await Promise.all([
    prisma.communityPost.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        likes: { select: { userId: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, image: true, role: true, createdAt: true,
        _count: { select: { communityPosts: true } },
      },
    }),
    prisma.communityPost.groupBy({
      by: ['status'],
      _count: true,
    }),
  ])

  const statMap = Object.fromEntries(stats.map((s: { status: string; _count: number }) => [s.status, s._count]))

  const serializedPosts = posts.map(p => ({ ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() }))
  const serializedUsers = users.map(u => ({ ...u, createdAt: u.createdAt.toISOString() }))

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-zinc-600">Admin</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Control Panel</h1>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', value: statMap['pending'] ?? 0, color: 'text-yellow-400' },
          { label: 'Approved', value: statMap['approved'] ?? 0, color: 'text-green-400' },
          { label: 'Rejected', value: statMap['rejected'] ?? 0, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-zinc-600">{s.label}</p>
          </div>
        ))}
      </div>

      <AdminPanel initialPosts={serializedPosts} initialUsers={serializedUsers} />
    </div>
  )
}
