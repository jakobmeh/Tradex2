'use client'

import { useState, useCallback, useEffect } from 'react'
import PostCard from './PostCard'
import Link from 'next/link'

type Like = { userId: string }
type User = { id: string; name: string | null; image: string | null }
type Post = {
  id: string
  imageBase64: string | null
  pair: string | null
  direction: string | null
  outcome: string | null
  pnl: number | null
  description: string | null
  createdAt: string
  user: User
  likes: Like[]
}
type Stats = {
  totalPosts: number
  totalLikes: number
  topPairs: { pair: string | null; _count: { pair: number } }[]
  directionCounts: { direction: string | null; _count: { direction: number } }[]
  outcomeCounts: { outcome: string | null; _count: { outcome: number } }[]
}

type Props = {
  initialPosts: Post[]
  currentUserId: string | null
}

const DIRECTION_FILTERS = [
  { value: '', label: 'All' },
  { value: 'long', label: '↑ Long' },
  { value: 'short', label: '↓ Short' },
]
const OUTCOME_FILTERS = [
  { value: '', label: 'All outcomes' },
  { value: 'win', label: '✓ Win' },
  { value: 'loss', label: '✕ Loss' },
  { value: 'be', label: '— BE' },
]
const SORT_OPTIONS = [
  { value: 'recent', label: 'Recent' },
  { value: 'top', label: 'Top' },
]

export default function CommunityFeed({ initialPosts, currentUserId }: Props) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialPosts.length === 12 ? (initialPosts[initialPosts.length - 1]?.id ?? null) : null
  )
  const [loading, setLoading] = useState(false)
  const [direction, setDirection] = useState('')
  const [outcome, setOutcome] = useState('')
  const [sort, setSort] = useState('recent')
  const [stats, setStats] = useState<Stats | null>(null)
  const [filtering, setFiltering] = useState(false)

  useEffect(() => {
    fetch('/api/community/stats')
      .then(r => r.json())
      .then((d: Stats) => setStats(d))
      .catch(() => {})
  }, [])

  const fetchPosts = useCallback(async (dir: string, out: string, s: string, cursor?: string) => {
    const params = new URLSearchParams()
    if (dir) params.set('direction', dir)
    if (out) params.set('outcome', out)
    if (s !== 'recent') params.set('sort', s)
    if (cursor) params.set('cursor', cursor)
    const res = await fetch(`/api/community?${params}`)
    return res.json() as Promise<{ posts: Post[]; nextCursor: string | null }>
  }, [])

  const applyFilter = useCallback(async (dir: string, out: string, s: string) => {
    setFiltering(true)
    try {
      const data = await fetchPosts(dir, out, s)
      setPosts(data.posts)
      setNextCursor(data.nextCursor)
    } finally {
      setFiltering(false)
    }
  }, [fetchPosts])

  const changeDirection = (val: string) => {
    setDirection(val)
    void applyFilter(val, outcome, sort)
  }
  const changeOutcome = (val: string) => {
    setOutcome(val)
    void applyFilter(direction, val, sort)
  }
  const changeSort = (val: string) => {
    setSort(val)
    void applyFilter(direction, outcome, val)
  }

  const loadMore = useCallback(async () => {
    if (!nextCursor || loading) return
    setLoading(true)
    try {
      const data = await fetchPosts(direction, outcome, sort, nextCursor)
      setPosts(prev => [...prev, ...data.posts])
      setNextCursor(data.nextCursor)
    } finally {
      setLoading(false)
    }
  }, [nextCursor, loading, fetchPosts, direction, outcome, sort])

  const handleLike = useCallback((postId: string, liked: boolean) => {
    if (!currentUserId) return
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      const likes = liked
        ? [...p.likes, { userId: currentUserId }]
        : p.likes.filter(l => l.userId !== currentUserId)
      return { ...p, likes }
    }))
  }, [currentUserId])

  return (
    <div className="flex gap-8 lg:items-start">
      {/* Main feed */}
      <div className="min-w-0 flex-1">
        {/* Filter bar */}
        <div className="mb-5 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {DIRECTION_FILTERS.map(f => (
              <button key={f.value} onClick={() => changeDirection(f.value)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                  direction === f.value
                    ? 'border-[#a37b34]/60 bg-[#a37b34]/15 text-[#f0d289]'
                    : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                }`}>
                {f.label}
              </button>
            ))}
            <span className="mx-1 h-4 w-px bg-zinc-800" />
            {OUTCOME_FILTERS.map(f => (
              <button key={f.value} onClick={() => changeOutcome(f.value)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                  outcome === f.value
                    ? 'border-[#a37b34]/60 bg-[#a37b34]/15 text-[#f0d289]'
                    : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                }`}>
                {f.label}
              </button>
            ))}
            <div className="ml-auto flex gap-1">
              {SORT_OPTIONS.map(s => (
                <button key={s.value} onClick={() => changeSort(s.value)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                    sort === s.value
                      ? 'border-[#a37b34]/60 bg-[#a37b34]/15 text-[#f0d289]'
                      : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Posts */}
        {filtering ? (
          <div className="flex justify-center py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-[#d5aa5e]" />
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 py-16 text-center">
            <p className="text-zinc-500">No posts found</p>
            {(direction || outcome) && (
              <button onClick={() => { setDirection(''); setOutcome(''); void applyFilter('', '', sort) }}
                className="mt-3 text-xs text-[#b99652] hover:text-[#f0d289]">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {posts.map(post => (
                <PostCard key={post.id} post={post} currentUserId={currentUserId} onLike={handleLike} />
              ))}
            </div>
            {nextCursor && (
              <div className="mt-6 flex justify-center">
                <button onClick={() => void loadMore()} disabled={loading}
                  className="rounded-xl border border-zinc-700 px-6 py-2 text-sm text-zinc-400 transition hover:border-zinc-600 hover:text-white disabled:opacity-40">
                  {loading ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 space-y-4 lg:block">
        {/* Post CTA */}
        <Link href="/community/new"
          className="flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#8b6122,#d5aa5e,#f0d289)] px-4 py-3 text-sm font-semibold text-[#140d05] shadow-[0_8px_24px_rgba(169,124,40,0.2)] transition hover:brightness-110">
          + Share a trade
        </Link>

        {/* Stats */}
        {stats && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
            <p className="mb-3 text-[11px] uppercase tracking-widest text-zinc-600">Community stats</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Total trades</span>
                <span className="text-sm font-semibold text-zinc-200">{stats.totalPosts}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Total likes</span>
                <span className="text-sm font-semibold text-zinc-200">{stats.totalLikes}</span>
              </div>
              {stats.directionCounts.map(d => d.direction && (
                <div key={d.direction} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500 capitalize">{d.direction}s</span>
                  <span className={`text-sm font-semibold ${d.direction === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                    {d._count.direction}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top pairs */}
        {stats && stats.topPairs.length > 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
            <p className="mb-3 text-[11px] uppercase tracking-widest text-zinc-600">Top pairs</p>
            <div className="space-y-2">
              {stats.topPairs.map((p, i) => p.pair && (
                <button key={p.pair} onClick={() => {
                  // filter by searching — just apply direction filter for now
                  // pair filtering could be added later
                }}
                  className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-600">#{i + 1}</span>
                    <span className="font-mono text-xs text-zinc-300">{p.pair}</span>
                  </div>
                  <span className="text-xs text-zinc-600">{p._count.pair} posts</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Win rate */}
        {stats && stats.outcomeCounts.length > 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
            <p className="mb-3 text-[11px] uppercase tracking-widest text-zinc-600">Outcomes</p>
            <div className="space-y-2">
              {stats.outcomeCounts.map(o => o.outcome && (
                <div key={o.outcome} className="flex items-center justify-between">
                  <span className={`text-xs capitalize ${
                    o.outcome === 'win' ? 'text-green-400' :
                    o.outcome === 'loss' ? 'text-red-400' : 'text-yellow-400'
                  }`}>{o.outcome === 'be' ? 'Break even' : o.outcome}</span>
                  <span className="text-sm font-semibold text-zinc-200">{o._count.outcome}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
