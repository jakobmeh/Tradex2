import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await prisma.workspaceMember.findFirst({ where: { userId: session.user.id } })
  if (!member) return NextResponse.json([])

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  if (!q.trim()) return NextResponse.json([])

  const [pages, databases] = await Promise.all([
    prisma.page.findMany({
      where: {
        workspaceId: member.workspaceId,
        isDeleted: false,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 8,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.database.findMany({
      where: {
        workspaceId: member.workspaceId,
        name: { contains: q, mode: 'insensitive' },
      },
      take: 4,
    }),
  ])

  const results = [
    ...pages.map(p => ({ id: p.id, title: p.title, type: 'page' as const, icon: p.icon })),
    ...databases.map(d => ({ id: d.id, title: d.name, type: 'database' as const, icon: d.icon })),
  ]

  return NextResponse.json(results)
}