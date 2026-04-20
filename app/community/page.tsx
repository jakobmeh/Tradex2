import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import CommunityFeed from '@/components/community/CommunityFeed'

export const revalidate = 0

export default async function CommunityPage() {
  const session = await auth()

  const posts = await prisma.communityPost.findMany({
    where: { status: 'approved' },
    orderBy: { createdAt: 'desc' },
    take: 12,
    include: {
      user: { select: { id: true, name: true, image: true } },
      likes: { select: { userId: true } },
    },
  })

  const serialized = posts.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Community</h1>
        <p className="mt-1 text-sm text-zinc-500">Trade ideas, results and setups from traders</p>
      </div>
      <CommunityFeed initialPosts={serialized} currentUserId={session?.user?.id ?? null} />
    </div>
  )
}
