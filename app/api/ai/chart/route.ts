import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as { description: string; databaseId: string }
  const { description, databaseId } = body

  // Fetch column names from the database
  const database = await prisma.database.findUnique({
    where: { id: databaseId },
    include: { properties: { orderBy: { order: 'asc' } } },
  })

  const columns = database?.properties.map((p) => `${p.name} (${p.type})`).join(', ') ?? 'unknown'

  const systemPrompt = `You are a data visualization assistant. Given a user's description of a chart they want, output ONLY valid JSON with these fields:
- chartType: "bar" or "pie"
- chartTitle: short human-readable title
- chartGroupBy: exact column name from the provided list to group/split the data by (or "" for no grouping)
- chartMetric: "count" (count entries per group) or "winrate" (% of entries that match a win-like value)

Available columns: ${columns}

Rules:
- Match column names exactly as given (case-sensitive)
- "count", "distribution", "breakdown" → chartMetric = "count"
- "win rate", "win %", "success rate" → chartMetric = "winrate"
- "by X" or "per X" or "grouped by X" → chartGroupBy = X column name
- If no grouping mentioned and metric is "winrate", set chartGroupBy = "" and use the result/outcome column
- Prefer "bar" unless user says "pie" or "donut"

Output ONLY the JSON object, no markdown, no explanation.`

  const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: description },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 200,
    }),
  })

  if (!openaiRes.ok) {
    return NextResponse.json({ error: 'AI error' }, { status: 502 })
  }

  const payload = await openaiRes.json()
  const content: string = payload.choices?.[0]?.message?.content ?? '{}'

  try {
    const config = JSON.parse(content) as {
      chartType: string
      chartTitle: string
      chartGroupBy: string
      chartMetric: string
    }
    return NextResponse.json(config)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }
}
