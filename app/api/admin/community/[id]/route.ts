import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) return false
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
  return user?.role === 'admin'
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { status } = await req.json() as { status: string }

  const post = await prisma.communityPost.update({
    where: { id },
    data: { status },
  })
  return NextResponse.json(post)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  await prisma.communityPost.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
