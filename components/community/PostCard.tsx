'use client'

import { useState } from 'react'
import Image from 'next/image'

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

type Props = {
  post: Post
  currentUserId: string | null
  onLike: (postId: string, liked: boolean) => void
}

const OUTCOME_COLORS: Record<string, string> = {
  win: 'text-green-400 bg-green-400/10 border-green-400/20',
  loss: 'text-red-400 bg-red-400/10 border-red-400/20',
  be: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
}

const DIRECTION_COLORS: Record<string, string> = {
  long: 'text-green-400',
  short: 'text-red-400',
}

export default function PostCard({ post, currentUserId, onLike }: Props) {
  const [liking, setLiking] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const liked = currentUserId ? post.likes.some(l => l.userId === currentUserId) : false
  const likeCount = post.likes.length

  const handleLike = async () => {
    if (!currentUserId || liking) return
    setLiking(true)
    try {
      const res = await fetch(`/api/community/${post.id}/like`, { method: 'POST' })
      const data = await res.json() as { liked: boolean }
      onLike(post.id, data.liked)
    } finally {
      setLiking(false)
    }
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const initials = post.user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/80 overflow-hidden transition hover:border-zinc-700">
      {post.imageBase64 && (
        <div className="relative aspect-video bg-zinc-950">
          <img
            src={post.imageBase64}
            alt="Trade chart"
            className="h-full w-full object-cover cursor-pointer"
            onClick={() => setExpanded(true)}
          />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2 min-w-0">
          {post.user.image ? (
            <Image
              src={post.user.image}
              alt={post.user.name ?? ''}
              width={28}
              height={28}
              className="rounded-full shrink-0"
            />
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-bold text-zinc-300">
              {initials}
            </div>
          )}
          <span className="truncate text-sm font-medium text-zinc-200">{post.user.name ?? 'Anonymous'}</span>
          <span className="ml-auto shrink-0 text-[11px] text-zinc-600">{timeAgo(post.createdAt)}</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {post.pair && (
            <span className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-300">
              {post.pair}
            </span>
          )}
          {post.direction && (
            <span className={`text-xs font-semibold uppercase ${DIRECTION_COLORS[post.direction] ?? 'text-zinc-400'}`}>
              {post.direction}
            </span>
          )}
          {post.outcome && (
            <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold uppercase ${OUTCOME_COLORS[post.outcome] ?? 'border-zinc-700 text-zinc-400'}`}>
              {post.outcome === 'be' ? 'BE' : post.outcome}
            </span>
          )}
          {post.pnl != null && (
            <span className={`text-xs font-semibold ${post.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {post.pnl >= 0 ? '+' : ''}{post.pnl}R
            </span>
          )}
        </div>

        {post.description && (
          <p className="text-sm leading-relaxed text-zinc-400 line-clamp-3">{post.description}</p>
        )}

        <div className="mt-auto pt-1 flex items-center gap-3">
          <button
            onClick={() => void handleLike()}
            disabled={!currentUserId || liking}
            className={`flex items-center gap-1.5 text-sm transition ${
              liked ? 'text-red-400' : 'text-zinc-600 hover:text-zinc-300'
            } disabled:cursor-default`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>{likeCount}</span>
          </button>

          {!currentUserId && (
            <span className="text-xs text-zinc-700">Sign in to like</span>
          )}
        </div>
      </div>

      {expanded && post.imageBase64 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setExpanded(false)}
        >
          <img
            src={post.imageBase64}
            alt="Trade chart"
            className="max-h-screen max-w-full rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  )
}
