import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export const maxDuration = 30

type AssetMode = 'crypto' | 'forex' | 'indices'

function extractResponseText(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null

  const maybeOutputText = (payload as { output_text?: unknown }).output_text
  if (typeof maybeOutputText === 'string' && maybeOutputText.trim()) {
    return maybeOutputText
  }

  const output = (payload as { output?: unknown }).output
  if (!Array.isArray(output)) return null

  const parts: string[] = []

  for (const item of output) {
    if (!item || typeof item !== 'object') continue
    const content = (item as { content?: unknown }).content
    if (!Array.isArray(content)) continue

    for (const block of content) {
      if (!block || typeof block !== 'object') continue
      const text = (block as { text?: unknown }).text
      if (typeof text === 'string') parts.push(text)
    }
  }

  return parts.join('\n').trim() || null
}

function parseNumberish(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null

  let s = value.trim()
  if (!s) return null

  s = s.replace(/\s+/g, '').replace(/[^0-9,.-]/g, '')
  if (!s) return null

  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')

  if (lastComma > lastDot) {
    s = s.replace(/\./g, '').replace(/,/g, '.')
  } else {
    s = s.replace(/,/g, '')
  }

  const parsed = Number(s)
  return Number.isFinite(parsed) ? parsed : null
}

function coerceMode(value: unknown, fallback: AssetMode): AssetMode {
  if (value === 'crypto' || value === 'forex' || value === 'indices') return value
  return fallback
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { imageBase64, preferredMode } = await req.json()
  if (!imageBase64) return NextResponse.json({ error: 'No image' }, { status: 400 })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  const fallbackMode: AssetMode =
    preferredMode === 'forex' || preferredMode === 'indices' || preferredMode === 'crypto'
      ? preferredMode
      : 'crypto'

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'developer',
          content: [
            {
              type: 'input_text',
              text:
                'Extract trading values from a screenshot. Return strict JSON only. If a value is not visible, return null. Parse numeric strings safely (including comma decimals).',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Read the screenshot and fill these fields: account, risk, entry, sl, tp, pipValue, pointValue, mode.

Mode rules:
- crypto: BTC/ETH/SOL/USDT pairs and crypto charts
- forex: EURUSD/GBPUSD/USDJPY and forex pairs
- indices: NAS100/US30/SPX/DAX and index charts

Use preferred mode "${fallbackMode}" when image is ambiguous.

Return numbers when possible, or null when missing.
For forex use pipValue if visible (default null if not visible).
For indices use pointValue if visible (default null if not visible).
Do not invent values.`,
            },
            {
              type: 'input_image',
              image_url: imageBase64,
              detail: 'high',
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'trade_extract',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              mode: { type: 'string', enum: ['crypto', 'forex', 'indices'] },
              account: { anyOf: [{ type: 'number' }, { type: 'string' }, { type: 'null' }] },
              risk: { anyOf: [{ type: 'number' }, { type: 'string' }, { type: 'null' }] },
              entry: { anyOf: [{ type: 'number' }, { type: 'string' }, { type: 'null' }] },
              sl: { anyOf: [{ type: 'number' }, { type: 'string' }, { type: 'null' }] },
              tp: { anyOf: [{ type: 'number' }, { type: 'string' }, { type: 'null' }] },
              pipValue: { anyOf: [{ type: 'number' }, { type: 'string' }, { type: 'null' }] },
              pointValue: { anyOf: [{ type: 'number' }, { type: 'string' }, { type: 'null' }] },
            },
            required: ['mode', 'account', 'risk', 'entry', 'sl', 'tp', 'pipValue', 'pointValue'],
          },
        },
      },
    }),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => null)
    const msg = errBody ?? `OpenAI error ${res.status}`
    return NextResponse.json({ error: msg.slice(0, 120) }, { status: 500 })
  }

  const payload = await res.json()
  const text = extractResponseText(payload)

  if (!text) {
    return NextResponse.json({ error: 'OpenAI returned empty response' }, { status: 500 })
  }

  try {
    const parsed = JSON.parse(text) as {
      mode?: unknown
      account?: unknown
      risk?: unknown
      entry?: unknown
      sl?: unknown
      tp?: unknown
      pipValue?: unknown
      pointValue?: unknown
    }

    const mode = coerceMode(parsed.mode, fallbackMode)
    const account = parseNumberish(parsed.account)
    const risk = parseNumberish(parsed.risk)
    const entry = parseNumberish(parsed.entry)
    const sl = parseNumberish(parsed.sl)
    const tp = parseNumberish(parsed.tp)
    const pipValue = parseNumberish(parsed.pipValue)
    const pointValue = parseNumberish(parsed.pointValue)

    return NextResponse.json({
      mode,
      account,
      risk,
      entry,
      sl,
      tp,
      pipValue,
      pointValue,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }
}
