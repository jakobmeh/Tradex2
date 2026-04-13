import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { blocks } = await req.json() as { blocks: { id: string; order: number }[] }

  if (!Array.isArray(blocks) || blocks.length === 0) {
    return NextResponse.json({ success: true })
  }

  await prisma.$transaction(
    blocks.map(({ id, order }) =>
      prisma.block.update({ where: { id }, data: { order } })
    )
  )

  return NextResponse.json({ success: true })
}
