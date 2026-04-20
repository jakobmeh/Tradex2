import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const me = session.user.id

  const q = new URL(req.url).searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json([])

  const users = await prisma.user.findMany({
    where: {
      id: { not: me },
      OR: [
        { email: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, email: true, image: true },
    take: 5,
  })

  // Attach existing friendship status for each result
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { senderId: me, receiverId: { in: users.map(u => u.id) } },
        { senderId: { in: users.map(u => u.id) }, receiverId: me },
      ],
    },
  })

  const results = users.map(user => {
    const f = friendships.find(fr => fr.senderId === user.id || fr.receiverId === user.id)
    return {
      ...user,
      friendshipStatus: f?.status ?? null,
      friendshipId: f?.id ?? null,
    }
  })

  return NextResponse.json(results)
}
