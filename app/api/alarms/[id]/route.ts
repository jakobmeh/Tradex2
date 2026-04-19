import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json() as Partial<{ title: string; message: string; time: string; days: string; isActive: boolean }>

  const alarm = await prisma.alarm.findUnique({ where: { id } })
  if (!alarm || alarm.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await prisma.alarm.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.message !== undefined && { message: body.message }),
      ...(body.time !== undefined && { time: body.time }),
      ...(body.days !== undefined && { days: body.days }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const alarm = await prisma.alarm.findUnique({ where: { id } })
  if (!alarm || alarm.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.alarm.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
