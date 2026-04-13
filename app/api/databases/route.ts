import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

async function getWorkspaceId(userId: string) {
  const member = await prisma.workspaceMember.findFirst({ where: { userId } })
  return member?.workspaceId ?? null
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const workspaceId = await getWorkspaceId(session.user.id)
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 404 })

  const databases = await prisma.database.findMany({
    where: { workspaceId },
    include: { properties: { orderBy: { order: 'asc' } }, views: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(databases)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const workspaceId = await getWorkspaceId(session.user.id)
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 404 })

  const body = await req.json()

  const database = await prisma.database.create({
    data: {
      name: body.name ?? 'Untitled Database',
      icon: body.icon ?? '🗄️',
      workspaceId,
      properties: {
        create: [
          { name: 'Name', type: 'title', order: 0, config: '{}' },
        ],
      },
      views: {
        create: [{ name: 'Default view', type: 'table' }],
      },
    },
    include: { properties: true, views: true },
  })
  return NextResponse.json(database)
}