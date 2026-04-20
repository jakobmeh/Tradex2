import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import FriendsClient from '@/components/friends/FriendsClient'
import { prisma } from '@/lib/prisma'

export const revalidate = 0

export default async function FriendsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const me = session.user.id

  const [sent, received] = await Promise.all([
    prisma.friendship.findMany({
      where: { senderId: me },
      include: { receiver: { select: { id: true, name: true, email: true, image: true } } },
    }),
    prisma.friendship.findMany({
      where: { receiverId: me },
      include: { sender: { select: { id: true, name: true, email: true, image: true } } },
    }),
  ])

  const friends = [
    ...sent.filter(f => f.status === 'accepted').map(f => ({ user: f.receiver, friendshipId: f.id })),
    ...received.filter(f => f.status === 'accepted').map(f => ({ user: f.sender, friendshipId: f.id })),
  ]
  const pendingReceived = received.filter(f => f.status === 'pending').map(f => ({ user: f.sender, friendshipId: f.id }))
  const pendingSent = sent.filter(f => f.status === 'pending').map(f => ({ user: f.receiver, friendshipId: f.id }))

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8 sm:py-12">
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-widest text-[#b99652]/60">Social</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Friends</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {friends.length > 0 ? `${friends.length} connection${friends.length !== 1 ? 's' : ''}` : 'Add traders to connect and share pages'}
          {pendingReceived.length > 0 && (
            <span className="ml-2 rounded-full bg-[#d5aa5e]/15 px-2 py-0.5 text-xs text-[#f0d289]">
              {pendingReceived.length} pending
            </span>
          )}
        </p>
      </div>
      <FriendsClient
        initialFriends={friends}
        initialPendingReceived={pendingReceived}
        initialPendingSent={pendingSent}
      />
    </div>
  )
}
