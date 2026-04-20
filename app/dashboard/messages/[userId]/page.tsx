import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import ConversationClient from './ConversationClient'

export const revalidate = 0

export default async function ConversationPage({ params }: { params: Promise<{ userId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const me = session.user.id
  const { userId } = await params

  const [otherUser, friendship] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, image: true },
    }),
    prisma.friendship.findFirst({
      where: {
        status: 'accepted',
        OR: [
          { senderId: me, receiverId: userId },
          { senderId: userId, receiverId: me },
        ],
      },
    }),
  ])

  if (!otherUser || !friendship) notFound()

  return <ConversationClient otherUser={otherUser} currentUserId={me} />
}
