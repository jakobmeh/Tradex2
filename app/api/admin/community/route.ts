import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) return null
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
  return user?.role === 'admin' ? session.user.id : null
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? undefined

  const posts = await prisma.communityPost.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      likes: { select: { userId: true } },
    },
  })

  return NextResponse.json(posts)
}
