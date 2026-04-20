import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { status } = await req.json() as { status: string }

  const friendship = await prisma.friendship.findUnique({ where: { id } })
  if (!friendship) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (friendship.receiverId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const updated = await prisma.friendship.update({ where: { id }, data: { status } })
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const friendship = await prisma.friendship.findUnique({ where: { id } })
  if (!friendship) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const me = session.user.id
  if (friendship.senderId !== me && friendship.receiverId !== me) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.friendship.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
