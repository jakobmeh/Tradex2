import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sendAlarmEmail } from '@/lib/mail'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const alarm = await prisma.alarm.findUnique({
    where: { id },
    include: { user: { select: { email: true, name: true } } },
  })

  if (!alarm || alarm.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!alarm.user.email) {
    return NextResponse.json({ error: 'No email on account' }, { status: 400 })
  }

  await sendAlarmEmail({
    email: alarm.user.email,
    name: alarm.user.name,
    title: alarm.title,
    message: alarm.message,
  })

  await prisma.alarm.update({ where: { id }, data: { lastSentAt: new Date() } })

  return NextResponse.json({ ok: true })
}
