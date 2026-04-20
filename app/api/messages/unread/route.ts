import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ count: 0 })

  const count = await prisma.directMessage.count({
    where: { receiverId: session.user.id, read: false },
  })

  return NextResponse.json({ count })
}
