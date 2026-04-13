import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { propertyId, value } = await req.json()

  const updated = await prisma.propertyValue.upsert({
    where: { entryId_propertyId: { entryId: id, propertyId } },
    update: { value: String(value) },
    create: { entryId: id, propertyId, value: String(value) },
  })
  return NextResponse.json(updated)
}
