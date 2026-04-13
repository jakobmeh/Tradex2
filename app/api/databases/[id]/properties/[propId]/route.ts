import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; propId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { propId } = await params
  const body = await req.json()
  const property = await prisma.databaseProperty.update({
    where: { id: propId },
    data: body,
  })
  return NextResponse.json(property)
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; propId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { propId } = await params
  await prisma.databaseProperty.delete({ where: { id: propId } })
  return NextResponse.json({ success: true })
}
