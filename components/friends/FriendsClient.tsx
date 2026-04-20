'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type FriendUser = { id: string; name: string | null; email: string | null; image: string | null }
type FriendEntry = { user: FriendUser; friendshipId: string }
type SearchResult = FriendUser & { friendshipStatus: string | null; friendshipId: string | null }

type Props = {
  initialFriends: FriendEntry[]
  initialPendingReceived: FriendEntry[]
  initialPendingSent: FriendEntry[]
}

function Avatar({ user, size = 36 }: { user: FriendUser; size?: number }) {
  const initials = user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'
  if (user.image) {
    return <Image src={user.image} alt={user.name ?? ''} width={size} height={size} sizes={`${size}px`} className="rounded-full shrink-0 object-cover" style={{ width: size, height: size }} />
  }
  return (
    <div className="flex shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-300" style={{ width: size, height: size }}>
      {initials}
    </div>
  )
}

export default function FriendsClient({ initialFriends, initialPendingReceived, initialPendingSent }: Props) {
  const [friends, setFriends] = useState<FriendEntry[]>(initialFriends)
  const [pendingReceived, setPendingReceived] = useState<FriendEntry[]>(initialPendingReceived)
  const [pendingSent, setPendingSent] = useState<FriendEntry[]>(initialPendingSent)

  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) { setSearchResults([]); return }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
        const data = await res.json() as SearchResult[]
        setSearchResults(data)
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [query])

  const sendRequest = async (user: FriendUser) => {
    setLoadingId(user.id)
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      })
      const data = await res.json() as { error?: string; user?: FriendUser; friendship?: { id: string } }
      if (res.ok && data.friendship) {
        setSentIds(prev => new Set([...prev, user.id]))
        setPendingSent(prev => [...prev, { user, friendshipId: data.friendship!.id }])
        setSearchResults(prev => prev.map(r => r.id === user.id ? { ...r, friendshipStatus: 'pending', friendshipId: data.friendship!.id } : r))
      }
    } finally {
      setLoadingId(null)
    }
  }

  const acceptRequest = async (friendshipId: string) => {
    setLoadingId(friendshipId)
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' }),
      })
      if (res.ok) {
        const entry = pendingReceived.find(f => f.friendshipId === friendshipId)!
        setPendingReceived(prev => prev.filter(f => f.friendshipId !== friendshipId))
        setFriends(prev => [...prev, entry])
      }
    } finally {
      setLoadingId(null)
    }
  }

  const rejectRequest = async (friendshipId: string) => {
    setLoadingId(friendshipId)
    try {
      await fetch(`/api/friends/${friendshipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      })
      setPendingReceived(prev => prev.filter(f => f.friendshipId !== friendshipId))
    } finally {
      setLoadingId(null)
    }
  }

  const removeFriend = async (friendshipId: string) => {
    if (!confirm('Remove this friend?')) return
    setLoadingId(friendshipId)
    try {
      await fetch(`/api/friends/${friendshipId}`, { method: 'DELETE' })
      setFriends(prev => prev.filter(f => f.friendshipId !== friendshipId))
    } finally {
      setLoadingId(null)
    }
  }

  const cancelRequest = async (friendshipId: string) => {
    setLoadingId(friendshipId)
    try {
      await fetch(`/api/friends/${friendshipId}`, { method: 'DELETE' })
      setPendingSent(prev => prev.filter(f => f.friendshipId !== friendshipId))
    } finally {
      setLoadingId(null)
    }
  }

  const friendIds = new Set(friends.map(f => f.user.id))
  const pendingReceivedIds = new Set(pendingReceived.map(f => f.user.id))
  const pendingSentIds = new Set(pendingSent.map(f => f.user.id))

  return (
    <div className="space-y-8">
      {/* Search / Add friend */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">Add friend</h2>
        <div className="relative">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">…</div>
          )}
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {searchResults.map(user => {
              const isFriend = friendIds.has(user.id)
              const isPendingReceived = pendingReceivedIds.has(user.id)
              const isPendingSent = pendingSentIds.has(user.id) || sentIds.has(user.id)

              return (
                <div key={user.id} className="flex items-center gap-3 rounded-xl border border-zinc-700/60 bg-zinc-800/60 p-3">
                  <Avatar user={user} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-100">{user.name ?? 'Unknown'}</p>
                    <p className="text-xs text-zinc-500">{user.email}</p>
                  </div>
                  <div className="shrink-0">
                    {isFriend ? (
                      <span className="rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs text-green-400">Friends ✓</span>
                    ) : isPendingReceived ? (
                      <span className="text-xs text-[#f0d289]">Wants to add you</span>
                    ) : isPendingSent ? (
                      <span className="rounded-xl border border-zinc-700 px-3 py-1.5 text-xs text-zinc-500">Request sent</span>
                    ) : (
                      <button
                        onClick={() => void sendRequest(user)}
                        disabled={loadingId === user.id}
                        className="rounded-xl bg-[linear-gradient(90deg,#8b6122,#d5aa5e,#f0d289)] px-4 py-1.5 text-xs font-semibold text-[#140d05] transition hover:brightness-110 disabled:opacity-40"
                      >
                        {loadingId === user.id ? '…' : '+ Add'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {query.length >= 2 && !searching && searchResults.length === 0 && (
          <p className="mt-3 text-xs text-zinc-600">No users found for &quot;{query}&quot;</p>
        )}
      </section>

      {/* Pending requests */}
      {pendingReceived.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-400">
            Incoming requests{' '}
            <span className="ml-1 rounded-full bg-[#d5aa5e]/20 px-1.5 py-0.5 text-xs text-[#f0d289]">{pendingReceived.length}</span>
          </h2>
          <div className="space-y-2">
            {pendingReceived.map(({ user, friendshipId }) => (
              <div key={friendshipId} className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3">
                <Avatar user={user} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-200">{user.name ?? 'Unknown'}</p>
                  <p className="text-xs text-zinc-600">{user.email}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => void acceptRequest(friendshipId)}
                    disabled={loadingId === friendshipId}
                    className="rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs text-green-400 transition hover:bg-green-500/20 disabled:opacity-40"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => void rejectRequest(friendshipId)}
                    disabled={loadingId === friendshipId}
                    className="rounded-xl border border-zinc-700 px-3 py-1.5 text-xs text-zinc-500 transition hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-40"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Friends list */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-400">
          Friends <span className="text-zinc-600">({friends.length})</span>
        </h2>
        {friends.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 py-10 text-center text-sm text-zinc-600">
            No friends yet — search above to add someone
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map(({ user, friendshipId }) => (
              <div key={friendshipId} className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3">
                <Avatar user={user} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-200">{user.name ?? 'Unknown'}</p>
                  <p className="text-xs text-zinc-600">{user.email}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Link
                    href={`/dashboard/messages/${user.id}`}
                    className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                  >
                    Message
                  </Link>
                  <button
                    onClick={() => void removeFriend(friendshipId)}
                    disabled={loadingId === friendshipId}
                    className="rounded-xl border border-zinc-800 px-2 py-1.5 text-xs text-zinc-600 transition hover:border-red-500/30 hover:text-red-400 disabled:opacity-40"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sent requests */}
      {pendingSent.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-400">Sent requests</h2>
          <div className="space-y-2">
            {pendingSent.map(({ user, friendshipId }) => (
              <div key={friendshipId} className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 opacity-70">
                <Avatar user={user} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-300">{user.name ?? 'Unknown'}</p>
                  <p className="text-xs text-zinc-600">{user.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-zinc-600">Pending</span>
                  <button
                    onClick={() => void cancelRequest(friendshipId)}
                    disabled={loadingId === friendshipId}
                    className="rounded-xl border border-zinc-800 px-2 py-1 text-xs text-zinc-600 transition hover:border-red-500/30 hover:text-red-400 disabled:opacity-40"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
