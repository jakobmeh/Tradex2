import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const me = session.user.id

  const { searchParams } = new URL(req.url)
  const withUserId = searchParams.get('with')
  const after = searchParams.get('after')

  if (withUserId) {
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: me, receiverId: withUserId },
          { senderId: withUserId, receiverId: me },
        ],
        ...(after ? { createdAt: { gt: new Date(after) } } : {}),
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    })

    await prisma.directMessage.updateMany({
      where: { senderId: withUserId, receiverId: me, read: false },
      data: { read: true },
    })

    return NextResponse.json(messages)
  }

  // Get conversation list (latest message per friend)
  const messages = await prisma.directMessage.findMany({
    where: { OR: [{ senderId: me }, { receiverId: me }] },
    orderBy: { createdAt: 'desc' },
    take: 500,
    include: {
      sender: { select: { id: true, name: true, image: true } },
      receiver: { select: { id: true, name: true, image: true } },
    },
  })

  const seen = new Set<string>()
  const conversations: typeof messages = []
  for (const msg of messages) {
    const otherId = msg.senderId === me ? msg.receiverId : msg.senderId
    if (!seen.has(otherId)) {
      seen.add(otherId)
      conversations.push(msg)
    }
  }

  return NextResponse.json(conversations)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const me = session.user.id

  const { receiverId, content } = await req.json() as { receiverId: string; content: string }
  if (!receiverId || !content?.trim()) {
    return NextResponse.json({ error: 'receiverId and content required' }, { status: 400 })
  }

  const friendship = await prisma.friendship.findFirst({
    where: {
      status: 'accepted',
      OR: [
        { senderId: me, receiverId },
        { senderId: receiverId, receiverId: me },
      ],
    },
  })
  if (!friendship) return NextResponse.json({ error: 'Not friends' }, { status: 403 })

  const message = await prisma.directMessage.create({
    data: { senderId: me, receiverId, content: content.trim() },
    include: { sender: { select: { id: true, name: true, image: true } } },
  })

  return NextResponse.json(message, { status: 201 })
}
