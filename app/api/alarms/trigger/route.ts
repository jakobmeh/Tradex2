import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendAlarmEmail } from '@/lib/mail'

export async function GET(req: Request) {
  // Verify cron secret (Vercel sets this automatically)
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const hh = String(now.getUTCHours()).padStart(2, '0')
  const mm = String(now.getUTCMinutes()).padStart(2, '0')
  const currentTime = `${hh}:${mm}`
  const dayOfWeek = now.getUTCDay() // 0=Sun, 6=Sat
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  // Find alarms that match this minute and haven't been sent today
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  const candidates = await prisma.alarm.findMany({
    where: {
      isActive: true,
      time: currentTime,
    },
    include: { user: { select: { email: true, name: true } } },
  })

  const toSend = candidates.filter(alarm => {
    // Check day schedule
    if (alarm.days === 'weekdays' && !isWeekday) return false
    if (alarm.days === 'weekends' && !isWeekend) return false
    // Check not already sent today
    if (alarm.lastSentAt && alarm.lastSentAt >= todayStart) return false
    return true
  })

  const results = await Promise.allSettled(
    toSend.map(async alarm => {
      if (!alarm.user.email) return
      await sendAlarmEmail({
        email: alarm.user.email,
        name: alarm.user.name,
        title: alarm.title,
        message: alarm.message,
      })
      await prisma.alarm.update({
        where: { id: alarm.id },
        data: { lastSentAt: now },
      })
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return NextResponse.json({ sent, failed, checked: candidates.length })
}
