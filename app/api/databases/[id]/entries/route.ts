import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const count = await prisma.databaseEntry.count({ where: { databaseId: id } })
  const properties = await prisma.databaseProperty.findMany({ where: { databaseId: id } })

  const entry = await prisma.databaseEntry.create({
    data: {
      databaseId: id,
      order: count,
      values: {
        create: properties.map((p: typeof properties[number]) => ({
          propertyId: p.id,
          value: p.type === 'checkbox' ? 'false' : '',
        })),
      },
    },
    include: { values: { include: { property: true } } },
  })
  return NextResponse.json(entry)
}
