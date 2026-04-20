import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: postId } = await params
  const userId = session.user.id

  const existing = await prisma.communityLike.findUnique({
    where: { userId_postId: { userId, postId } },
  })

  if (existing) {
    await prisma.communityLike.delete({ where: { userId_postId: { userId, postId } } })
    return NextResponse.json({ liked: false })
  }

  await prisma.communityLike.create({ data: { userId, postId } })
  return NextResponse.json({ liked: true })
}
