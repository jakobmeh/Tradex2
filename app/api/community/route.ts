import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export const maxDuration = 30

async function moderateWithAI(post: {
  description?: string | null
  pair?: string | null
  outcome?: string | null
  direction?: string | null
  imageBase64?: string | null
}): Promise<{ status: 'approved' | 'rejected'; reason: string }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return { status: 'approved', reason: 'AI moderation unavailable' }

  const textContent = [
    post.pair ? `Pair: ${post.pair}` : null,
    post.direction ? `Direction: ${post.direction}` : null,
    post.outcome ? `Outcome: ${post.outcome}` : null,
    post.description ? `Description: ${post.description}` : null,
  ].filter(Boolean).join('\n')

  const userContent: unknown[] = [
    {
      type: 'input_text',
      text: `Review this community trade post. Approve if it is a genuine trade post (trading chart, trade result, trading discussion). Reject if it contains spam, offensive content, unrelated content, or fake/nonsensical data.\n\nPost content:\n${textContent || '(no text, image only)'}`,
    },
  ]

  if (post.imageBase64 && post.imageBase64.startsWith('data:image')) {
    userContent.push({
      type: 'input_image',
      image_url: post.imageBase64,
      detail: 'low',
    })
  }

  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        input: [{ role: 'user', content: userContent }],
        text: {
          format: {
            type: 'json_schema',
            name: 'moderation',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                decision: { type: 'string', enum: ['approved', 'rejected'] },
                reason: { type: 'string' },
              },
              required: ['decision', 'reason'],
            },
          },
        },
      }),
    })

    if (!res.ok) return { status: 'approved', reason: 'AI check failed, auto-approved' }

    const payload = await res.json() as { output?: Array<{ content?: Array<{ text?: string }> }> }
    const text = payload.output?.[0]?.content?.[0]?.text ?? ''
    const parsed = JSON.parse(text) as { decision: string; reason: string }
    return {
      status: parsed.decision === 'rejected' ? 'rejected' : 'approved',
      reason: parsed.reason,
    }
  } catch {
    return { status: 'approved', reason: 'AI check failed, auto-approved' }
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor')
  const direction = searchParams.get('direction')
  const outcome = searchParams.get('outcome')
  const sort = searchParams.get('sort') ?? 'recent'
  const take = 12

  const where = {
    status: 'approved',
    ...(direction ? { direction } : {}),
    ...(outcome ? { outcome } : {}),
  }

  const orderBy = sort === 'top'
    ? [{ likes: { _count: 'desc' as const } }, { createdAt: 'desc' as const }]
    : [{ createdAt: 'desc' as const }]

  const posts = await prisma.communityPost.findMany({
    where,
    orderBy,
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      user: { select: { id: true, name: true, image: true } },
      likes: { select: { userId: true } },
    },
  })

  const hasMore = posts.length > take
  const items = hasMore ? posts.slice(0, take) : posts
  const nextCursor = hasMore ? items[items.length - 1].id : null

  return NextResponse.json({ posts: items, nextCursor })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    imageBase64?: string
    pair?: string
    direction?: string
    outcome?: string
    pnl?: number
    description?: string
  }

  const post = await prisma.communityPost.create({
    data: {
      userId: session.user.id,
      imageBase64: body.imageBase64 ?? null,
      pair: body.pair?.trim() || null,
      direction: body.direction || null,
      outcome: body.outcome || null,
      pnl: body.pnl ?? null,
      description: body.description?.trim() || null,
      status: 'pending',
    },
  })

  const moderation = await moderateWithAI({
    description: post.description,
    pair: post.pair,
    outcome: post.outcome,
    direction: post.direction,
    imageBase64: post.imageBase64,
  })

  const updated = await prisma.communityPost.update({
    where: { id: post.id },
    data: { status: moderation.status, aiReason: moderation.reason },
  })

  return NextResponse.json(updated, { status: 201 })
}
