import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'

export const revalidate = 0

export default async function MessagesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const me = session.user.id

  const messages = await prisma.directMessage.findMany({
    where: { OR: [{ senderId: me }, { receiverId: me }] },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, name: true, image: true } },
      receiver: { select: { id: true, name: true, image: true } },
    },
  })

  const seen = new Set<string>()
  const conversations: Array<{
    user: { id: string; name: string | null; image: string | null }
    lastMessage: string
    unread: boolean
    time: Date
  }> = []

  for (const msg of messages) {
    const other = msg.senderId === me ? msg.receiver : msg.sender
    if (!seen.has(other.id)) {
      seen.add(other.id)
      conversations.push({
        user: other,
        lastMessage: msg.content,
        unread: msg.receiverId === me && !msg.read,
        time: msg.createdAt,
      })
    }
  }

  const timeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'now'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-8 sm:py-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-[#b99652]/60">Social</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Messages</h1>
        </div>
        <Link
          href="/dashboard/friends"
          className="rounded-xl border border-[#6f592d]/30 px-3 py-1.5 text-xs text-[#b99652] transition hover:border-[#9f7c3a]/50 hover:text-[#f0d289]"
        >
          + New
        </Link>
      </div>

      {conversations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 py-16 text-center">
          <p className="text-sm text-zinc-500">No messages yet</p>
          <Link href="/dashboard/friends" className="mt-3 inline-block text-xs text-[#b99652] transition hover:text-[#f0d289]">
            Add friends to start chatting →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800">
          {conversations.map(({ user, lastMessage, unread, time }, i) => (
            <Link
              key={user.id}
              href={`/dashboard/messages/${user.id}`}
              className={`flex items-center gap-3 px-4 py-3.5 transition hover:bg-zinc-800/50 ${i !== 0 ? 'border-t border-zinc-800' : ''} ${unread ? 'bg-zinc-900/60' : ''}`}
            >
              {user.image ? (
                <Image src={user.image} alt={user.name ?? ''} width={40} height={40} className="rounded-full shrink-0 object-cover" />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-sm font-bold text-zinc-300">
                  {user.name?.charAt(0).toUpperCase() ?? '?'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-medium ${unread ? 'text-white' : 'text-zinc-300'}`}>{user.name ?? 'Unknown'}</p>
                  <span className="shrink-0 text-[11px] text-zinc-600">{timeAgo(time)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <p className={`truncate text-xs ${unread ? 'text-zinc-400' : 'text-zinc-600'}`}>{lastMessage}</p>
                  {unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#f0d289]" />}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
