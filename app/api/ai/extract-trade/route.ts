import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { imageBase64 } = await req.json()
  if (!imageBase64) return NextResponse.json({ error: 'No image' }, { status: 400 })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  const mimeMatch = imageBase64.match(/^data:(image\/[a-z]+);base64,/)
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png'

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 300,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageBase64, detail: 'high' },
            },
            {
              type: 'text',
              text: `Analyze this TradingView chart screenshot and extract trade prices. Always return JSON — never refuse or explain.

The TradingView labels "Stop: X (Y%)" and "Target: X (Y%)" show:
- X = point DISTANCE from entry (not the actual price)
- Y% = that distance as a percentage of the entry price

METHOD A — if you can see OHLC or current price on chart:
  entry = C value from OHLC bar, or price shown in BUY/SELL button
  sl = entry - stop_distance (long) or entry + stop_distance (short)
  tp = entry + target_distance (long) or entry - target_distance (short)

METHOD B — if OHLC not visible, calculate entry from percentage:
  entry = stop_distance / (stop_percentage / 100)
  Example: "Stop: 129 (0.170%)" → entry = 129 / 0.00170 = 75882
  Then: sl = entry - 129, tp = entry + target_distance

Use whichever method gives consistent R:R with what the chart shows.

Asset type detection:
- BTC/ETH/SOL/altcoin or XXXUSDT → "crypto"
- EURUSD/GBPUSD/USDJPY etc → "forex"
- NAS100/US30/SPX/DAX → "indices"
- Default "crypto" if unclear

IMPORTANT: Return ONLY this JSON and nothing else:
{"entry":<number>,"sl":<number>,"tp":<number>,"mode":"crypto"}`,
            },
          ],
        },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  const payload = await res.json()
  const text = payload.choices?.[0]?.message?.content ?? ''

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch?.[0] ?? text)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response', raw: text }, { status: 500 })
  }
}
