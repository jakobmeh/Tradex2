import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { blocks } = await req.json() as { blocks: { id: string; order: number }[] }

  await Promise.all(
    blocks.map(b => prisma.block.update({ where: { id: b.id }, data: { order: b.order } }))
  )
  return NextResponse.json({ success: true })
}