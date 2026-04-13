import { NextResponse } from 'next/server'
import { auth } from '@/auth'

type ChatMessage = { role: 'user' | 'assistant'; content: string }
type ChatDatabase = { id: string; name: string; columns: string[] }

function buildSystemPrompt(pageTitle: string, databases: ChatDatabase[]): string {
  const dbContext =
    databases.length > 0
      ? databases
          .map((d) => `  - "${d.name}" (id: ${d.id}, columns: ${d.columns.join(', ')})`)
          .join('\n')
      : '  (no databases on this page yet)'

  return `You are an AI assistant inside a productivity app called Tradex. Help users build their page by creating content, tables, and data visualizations through chat.

Current page: "${pageTitle}"
Databases on this page:
${dbContext}

Always respond with valid JSON in EXACTLY this structure:
{
  "message": "<your friendly reply>",
  "actions": []
}

Available actions:

1. create_table — create a new database table
{
  "type": "create_table",
  "tableName": "string",
  "tableIcon": "emoji",
  "columns": [
    { "name": "Name", "type": "title", "options": [] },
    { "name": "Column", "type": "text|number|select|date|checkbox|url|email|rating", "options": ["opt1","opt2"] }
  ]
}
Rules: always start with exactly one "title" column. For select columns include realistic options.

2. add_text — add a text or heading block
{ "type": "add_text", "blockType": "text|heading1|heading2|heading3|callout|quote", "text": "string" }

3. add_stat — add a live-updating stat that reads from a database
{
  "type": "add_stat",
  "databaseId": "<id from databases above, or __created__ if you just created a table>",
  "statLabel": "Win Rate",
  "statFormula": "winrate|count|sum|average",
  "statColumn": "<column name>",
  "statFilterValue": "<value counted as win, e.g. Win>"
}

4. add_chart — add a chart from a database
{
  "type": "add_chart",
  "databaseId": "<id from databases above, or __created__>",
  "chartType": "bar|pie",
  "chartTitle": "string",
  "chartGroupBy": "<column name to group by, or empty string for overall>",
  "chartMetric": "winrate|count"
}

For trading journals: suggest columns like Direction (select: Long/Short), Entry, SL, TP, Result (select: Win/Loss/Breakeven), Setup, Date, Notes.
For winrate stats: statColumn = result column name, statFilterValue = "Win".
If creating a table and stat in the same response, use databaseId "__created__" for the stat/chart.
If the user asks to add a chart/stat for an existing table ("this table", "that table", "already exists"), do NOT create a new table.
Prefer using an existing databaseId from context, and only create_table when the user clearly asks for a brand-new table.
Be concise and helpful.`
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 })
  }

  const body = (await req.json()) as {
    messages: ChatMessage[]
    pageContext: { title: string; databases: ChatDatabase[] }
  }

  const { messages, pageContext } = body
  const systemPrompt = buildSystemPrompt(pageContext?.title ?? 'Untitled', pageContext?.databases ?? [])

  const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      response_format: { type: 'json_object' },
      max_tokens: 1200,
    }),
  })

  if (!openaiRes.ok) {
    const err = await openaiRes.text()
    return NextResponse.json({ error: `OpenAI error: ${err.slice(0, 200)}` }, { status: 502 })
  }

  const payload = await openaiRes.json()
  const content: string = payload.choices?.[0]?.message?.content ?? '{}'

  let result: { message: string; actions: unknown[] }
  try {
    result = JSON.parse(content) as { message: string; actions: unknown[] }
  } catch {
    result = { message: content, actions: [] }
  }

  return NextResponse.json({
    message: result.message ?? '',
    actions: Array.isArray(result.actions) ? result.actions : [],
  })
}
