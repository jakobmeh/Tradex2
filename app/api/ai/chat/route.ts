import { NextResponse } from 'next/server'
import { auth } from '@/auth'

type ChatMessage = { role: 'user' | 'assistant'; content: string }
type ChatDatabase = { id: string; name: string; columns: string[]; stats?: string }
type ChatBlock = { id: string; type: string; databaseId?: string; text?: string }

function buildSystemPrompt(pageTitle: string, databases: ChatDatabase[], blocks: ChatBlock[]): string {
  const dbContext =
    databases.length > 0
      ? databases
          .map((d) => {
            const base = `  - "${d.name}" (id: ${d.id}, columns: ${d.columns.join(', ')})`
            return d.stats ? `${base}\n    current data: ${d.stats}` : base
          })
          .join('\n')
      : '  (no databases on this page yet)'

  const blockContext =
    blocks.length > 0
      ? blocks.map((b) => `  - [${b.type}] id: ${b.id}${b.databaseId ? ` db: ${b.databaseId}` : ''}${b.text ? ` "${b.text}"` : ''}`).join('\n')
      : '  (no blocks)'

  return `You are an AI assistant inside a productivity app called Tradex. Help users build their page by creating content, tables, and data visualizations through chat.

Current page: "${pageTitle}"
Databases on this page:
${dbContext}

Blocks on this page:
${blockContext}

Always respond with valid JSON in EXACTLY this structure:
{ "message": "<your friendly reply>", "actions": [] }

---
UNDERSTANDING THE USER
- Users type casually, informally, or in broken English. Always try to understand intent.
- "make a chart", "add chart", "show chart" → add_chart
- "what's my win rate", "how am i doing", "calculate win rate", "show stats", "koliko imam win rate", "izracunaj win rate" → answer from stats context OR compute_stat
- "make a table", "create journal", "setup tracker" → create_table
- "add stat", "show win rate block", "live stat" → add_stat
- "delete that", "remove the chart", "clear page" → remove_blocks
- "that table", "my journal", "the data", "that database" → use the existing database from context
- If the user says "make a chart from that" or "from this table" → use the database already on the page (do NOT create a new one)
- If there is only one database on the page and the user doesn't specify, use that one

ANSWERING DATA QUESTIONS DIRECTLY:
- If the user asks "what is my win rate" or similar AND the stats context already contains "win rate (Column): X% (W/T)", read that number and answer directly in your message — NO compute_stat needed.
- Example: stats say "win rate (Result): 66% (2/3)" → reply "Your win rate is 66% — 2 wins out of 3 trades."
- Only use compute_stat if the win rate is NOT already in the stats context.

---
AVAILABLE ACTIONS

1. create_table
{
  "type": "create_table",
  "tableName": "string",
  "tableIcon": "emoji",
  "columns": [
    { "name": "Name", "type": "title", "options": [] },
    { "name": "Column", "type": "text|number|select|date|checkbox|url|email|rating", "options": ["opt1","opt2"] }
  ]
}
- Always start with exactly one "title" column
- For select columns include realistic options

2. add_text
{ "type": "add_text", "blockType": "text|heading1|heading2|heading3|callout|quote", "text": "string" }

3. add_stat — live stat block on the page
{
  "type": "add_stat",
  "databaseId": "<id from context, or __created__>",
  "statLabel": "string",
  "statFormula": "winrate|count|sum|average",
  "statColumn": "<exact column name from context>",
  "statFilterValue": "<win label, e.g. Win>"
}

4. add_chart — chart block on the page
{
  "type": "add_chart",
  "databaseId": "<id from context, or __created__>",
  "chartType": "bar|pie",
  "chartTitle": "string",
  "chartGroupBy": "<exact column name from context to group by, or empty string>",
  "chartMetric": "winrate|count"
}

For trading journals: suggest columns like Direction (select: Long/Short), Entry (number), SL (number), TP (number), Result (select: Win/Loss/Breakeven), P&L (number, for profit/loss in money), Setup (text), Date (date), Notes (text). Always include P&L as a number column so the user can track how much money they made or lost per trade.
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
    pageContext: { title: string; databases: ChatDatabase[]; blocks?: ChatBlock[] }
  }

  const { messages, pageContext } = body
  const systemPrompt = buildSystemPrompt(pageContext?.title ?? 'Untitled', pageContext?.databases ?? [], pageContext?.blocks ?? [])

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
