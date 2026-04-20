import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 60

export async function GET() {
  const [totalPosts, totalLikes, topPairs, directionCounts, outcomeCounts] = await Promise.all([
    prisma.communityPost.count({ where: { status: 'approved' } }),
    prisma.communityLike.count(),
    prisma.communityPost.groupBy({
      by: ['pair'],
      where: { status: 'approved', pair: { not: null } },
      _count: { pair: true },
      orderBy: { _count: { pair: 'desc' } },
      take: 5,
    }),
    prisma.communityPost.groupBy({
      by: ['direction'],
      where: { status: 'approved', direction: { not: null } },
      _count: { direction: true },
    }),
    prisma.communityPost.groupBy({
      by: ['outcome'],
      where: { status: 'approved', outcome: { not: null } },
      _count: { outcome: true },
    }),
  ])

  return NextResponse.json({ totalPosts, totalLikes, topPairs, directionCounts, outcomeCounts })
}
