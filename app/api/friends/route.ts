import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const me = session.user.id

  const [sent, received] = await Promise.all([
    prisma.friendship.findMany({
      where: { senderId: me },
      include: { receiver: { select: { id: true, name: true, email: true, image: true } } },
    }),
    prisma.friendship.findMany({
      where: { receiverId: me },
      include: { sender: { select: { id: true, name: true, email: true, image: true } } },
    }),
  ])

  const friends = [
    ...sent.filter(f => f.status === 'accepted').map(f => ({ ...f.receiver, friendshipId: f.id })),
    ...received.filter(f => f.status === 'accepted').map(f => ({ ...f.sender, friendshipId: f.id })),
  ]

  const pendingReceived = received
    .filter(f => f.status === 'pending')
    .map(f => ({ ...f.sender, friendshipId: f.id }))

  const pendingSent = sent
    .filter(f => f.status === 'pending')
    .map(f => ({ ...f.receiver, friendshipId: f.id }))

  return NextResponse.json({ friends, pendingReceived, pendingSent })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const me = session.user.id

  const { email } = await req.json() as { email: string }
  if (!email?.trim()) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const target = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, name: true, email: true, image: true },
  })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (target.id === me) return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 })

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { senderId: me, receiverId: target.id },
        { senderId: target.id, receiverId: me },
      ],
    },
  })
  if (existing) return NextResponse.json({ error: 'Request already exists' }, { status: 409 })

  const friendship = await prisma.friendship.create({
    data: { senderId: me, receiverId: target.id },
  })
  return NextResponse.json({ friendship, user: target }, { status: 201 })
}
