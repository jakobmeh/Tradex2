import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const database = await prisma.database.findUnique({
    where: { id },
    include: {
      properties: { orderBy: { order: 'asc' } },
      views: true,
      entries: {
        where: { isDeleted: false },
        orderBy: { order: 'asc' },
        include: {
          values: { include: { property: true } },
        },
      },
    },
  })
  if (!database) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(database)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const database = await prisma.database.update({
    where: { id },
    data: body,
  })
  return NextResponse.json(database)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.database.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
