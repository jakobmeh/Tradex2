import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const alarms = await prisma.alarm.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(alarms)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { title: string; message: string; time: string; days: string }

  if (!body.title?.trim() || !body.time) {
    return NextResponse.json({ error: 'title and time are required' }, { status: 400 })
  }

  const alarm = await prisma.alarm.create({
    data: {
      userId: session.user.id,
      title: body.title.trim(),
      message: body.message?.trim() ?? '',
      time: body.time,
      days: body.days ?? 'daily',
    },
  })
  return NextResponse.json(alarm, { status: 201 })
}
