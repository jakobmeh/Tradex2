import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const count = await prisma.databaseProperty.count({ where: { databaseId: id } })

  const property = await prisma.databaseProperty.create({
    data: {
      name: body.name ?? 'New column',
      type: body.type ?? 'text',
      order: count,
      config: body.config ?? '{}',
      databaseId: id,
    },
  })
  return NextResponse.json(property)
}
