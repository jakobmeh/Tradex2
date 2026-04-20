import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 300 // cache 5 min

type FinnhubEvent = {
  country: string
  event: string
  impact: string
  time: string
  actual: string | null
  estimate: string | null
  prev: string | null
  unit: string | null
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'FINNHUB_API_KEY not set', events: [] })
  }

  const { searchParams } = new URL(req.url)
  const range = searchParams.get('range') ?? 'today'

  const now = new Date()
  const from = now.toISOString().split('T')[0]
  let to: string
  if (range === 'week') {
    const end = new Date(now)
    end.setDate(end.getDate() + 6)
    to = end.toISOString().split('T')[0]
  } else {
    to = from
  }

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${apiKey}`,
      { next: { revalidate: 300 } }
    )

    if (!res.ok) {
      return NextResponse.json({ error: `Finnhub error ${res.status}`, events: [] })
    }

    const data = await res.json() as { economicCalendar: FinnhubEvent[] }
    const events = (data.economicCalendar ?? []).sort((a, b) =>
      new Date(a.time).getTime() - new Date(b.time).getTime()
    )

    return NextResponse.json({ events })
  } catch (e) {
    return NextResponse.json({ error: String(e), events: [] })
  }
}
