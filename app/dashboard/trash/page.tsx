import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import TrashClient from './TrashClient'

export default async function TrashPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const member = await prisma.workspaceMember.findFirst({ where: { userId: session.user.id } })
  if (!member) redirect('/dashboard')

  const deleted = await prisma.page.findMany({
    where: { workspaceId: member.workspaceId, isDeleted: true },
    orderBy: { updatedAt: 'desc' },
  })

  return <TrashClient pages={deleted} />
}
