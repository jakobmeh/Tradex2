import { NextResponse } from 'next/server'
import { auth, ensureWorkspace } from '@/auth'
import { prisma } from '@/lib/prisma'
import { aiTablePromptSchema, aiTableSchema, type AITableSchema } from '@/lib/ai-table'

const SELECT_COLORS = ['gray', 'red', 'orange', 'yellow', 'green', 'blue', 'purple'] as const

async function getUserWorkspace(userId: string) {
  let member = await prisma.workspaceMember.findFirst({ where: { userId } })
  if (!member) {
    await ensureWorkspace(userId)
    member = await prisma.workspaceMember.findFirst({ where: { userId } })
  }
  return member?.workspaceId ?? null
}

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

function normalizeSchema(schema: AITableSchema): AITableSchema {
  const seen = new Set<string>()
  const properties = schema.properties
    .map((property, index) => {
      const cleanName = property.name.trim() || `Column ${index + 1}`
      const key = cleanName.toLowerCase()
      if (seen.has(key)) return null
      seen.add(key)
      return {
        ...property,
        name: cleanName,
        options: property.options?.filter(Boolean).slice(0, 12),
      }
    })
    .filter((property): property is NonNullable<typeof property> => Boolean(property))

  const titleIndex = properties.findIndex(property => property.type === 'title')

  if (titleIndex === -1) {
    properties.unshift({ name: 'Name', type: 'title', options: [] })
  } else if (titleIndex > 0) {
    const [titleProperty] = properties.splice(titleIndex, 1)
    properties.unshift(titleProperty)
  }

  return {
    name: schema.name.trim() || 'Untitled Database',
    icon: schema.icon?.trim() || '🗂️',
    properties: properties.slice(0, 12),
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 })
  }

  const workspaceId = await getUserWorkspace(session.user.id)
  if (!workspaceId) {
    return NextResponse.json({ error: 'No workspace' }, { status: 404 })
  }

  const body = await req.json()
  const parsedPrompt = aiTablePromptSchema.safeParse(body)

  if (!parsedPrompt.success) {
    return NextResponse.json({ error: 'Invalid prompt' }, { status: 400 })
  }

  const openaiRes = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-mini',
      input: [
        {
          role: 'developer',
          content: [
            {
              type: 'input_text',
              text:
                'Generate a practical database schema for a productivity app. Return only a concise schema. Use exactly one title column. Prefer useful, real-world columns and avoid duplicates. Supported types: title, text, number, select, multi_select, date, checkbox, url, email, rating.',
            },
          ],
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: parsedPrompt.data.prompt }],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'database_schema',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              name: { type: 'string' },
              icon: { type: 'string' },
              properties: {
                type: 'array',
                minItems: 1,
                maxItems: 12,
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    name: { type: 'string' },
                    type: {
                      type: 'string',
                      enum: ['title', 'text', 'number', 'select', 'multi_select', 'date', 'checkbox', 'url', 'email', 'rating'],
                    },
                    options: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                  },
                  required: ['name', 'type', 'options'],
                },
              },
            },
            required: ['name', 'icon', 'properties'],
          },
        },
      },
    }),
  })

  if (!openaiRes.ok) {
    const errorText = await openaiRes.text()
    return NextResponse.json({ error: `OpenAI request failed: ${errorText.slice(0, 300)}` }, { status: 502 })
  }

  const openaiPayload = await openaiRes.json()
  const responseText = extractResponseText(openaiPayload)

  if (!responseText) {
    return NextResponse.json({ error: 'OpenAI returned no schema text' }, { status: 502 })
  }

  let schema: AITableSchema

  try {
    schema = normalizeSchema(aiTableSchema.parse(JSON.parse(responseText)))
  } catch {
    return NextResponse.json({ error: 'OpenAI returned an invalid schema' }, { status: 502 })
  }

  const database = await prisma.database.create({
    data: {
      name: schema.name,
      icon: schema.icon ?? '🗂️',
      workspaceId,
      properties: {
        create: schema.properties.map((property, index) => ({
          name: property.name,
          type: property.type,
          order: index,
          config:
            property.type === 'select' || property.type === 'multi_select'
              ? JSON.stringify({
                  options: (property.options ?? []).map((label, optionIndex) => ({
                    id: crypto.randomUUID(),
                    label,
                    color: SELECT_COLORS[optionIndex % SELECT_COLORS.length],
                  })),
                })
              : '{}',
        })),
      },
      views: {
        create: [{ name: 'Default view', type: 'table' }],
      },
    },
  })

  return NextResponse.json({
    databaseId: database.id,
    databaseName: database.name,
  })
}
