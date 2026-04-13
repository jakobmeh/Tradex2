import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const blocks = await prisma.block.findMany({
    where: { pageId: id, isDeleted: false, parentId: null },
    orderBy: { order: 'asc' },
    include: {
      children: {
        where: { isDeleted: false },
        orderBy: { order: 'asc' },
      },
    },
  })
  return NextResponse.json(blocks)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const body = await req.json()
  const block = await prisma.block.create({
    data: {
      type: body.type ?? 'text',
      content: body.content ?? '{}',
      order: body.order ?? 0,
      pageId: id,
      parentId: body.parentId ?? null,
    },
  })
  return NextResponse.json(block)
}
