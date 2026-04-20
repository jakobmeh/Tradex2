import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const me = session.user.id
  const { id: pageId } = await params

  const { friendId, role } = await req.json() as { friendId: string; role?: string }
  if (!friendId) return NextResponse.json({ error: 'friendId required' }, { status: 400 })
  const shareRole = role === 'editor' ? 'editor' : 'viewer'

  const [page, friendship] = await Promise.all([
    prisma.page.findFirst({
      where: { id: pageId, isDeleted: false, workspace: { members: { some: { userId: me } } } },
      select: { id: true, title: true, icon: true },
    }),
    prisma.friendship.findFirst({
      where: {
        status: 'accepted',
        OR: [
          { senderId: me, receiverId: friendId },
          { senderId: friendId, receiverId: me },
        ],
      },
    }),
  ])

  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  if (!friendship) return NextResponse.json({ error: 'Not friends' }, { status: 403 })

  const sharer = await prisma.user.findUnique({ where: { id: me }, select: { name: true } })

  await Promise.all([
    prisma.pageShare.upsert({
      where: { pageId_sharedWithId: { pageId, sharedWithId: friendId } },
      create: { pageId, sharedById: me, sharedWithId: friendId, role: shareRole },
      update: { role: shareRole },
    }),
    prisma.directMessage.create({
      data: {
        senderId: me,
        receiverId: friendId,
        content: `${sharer?.name ?? 'Someone'} shared a page with you: "${page.title || 'Untitled'}" 👉 ${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/dashboard/pages/${pageId}`,
      },
    }),
  ])

  return NextResponse.json({ ok: true })
}
