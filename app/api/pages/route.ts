import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth, ensureWorkspace } from '@/auth'

async function getUserWorkspace(userId: string) {
  let member = await prisma.workspaceMember.findFirst({ where: { userId } })
  if (!member) {
    await ensureWorkspace(userId)
    member = await prisma.workspaceMember.findFirst({ where: { userId } })
  }
  return member?.workspaceId ?? null
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const workspaceId = await getUserWorkspace(session.user.id)
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 404 })

  const pages = await prisma.page.findMany({
    where: { workspaceId, parentId: null, isDeleted: false },
    orderBy: { order: 'asc' },
    include: {
      children: {
        where: { isDeleted: false },
        orderBy: { order: 'asc' },
      },
    },
  })
  return NextResponse.json(pages)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const workspaceId = await getUserWorkspace(session.user.id)
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 404 })

  const body = await req.json()
  const page = await prisma.page.create({
    data: {
      title: body.title ?? 'Untitled',
      icon: body.icon ?? null,
      parentId: body.parentId ?? null,
      workspaceId,
    },
  })
  return NextResponse.json(page)
}
