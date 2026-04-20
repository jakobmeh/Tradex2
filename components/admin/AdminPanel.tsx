'use client'

import { useState } from 'react'
import Image from 'next/image'

type User = { id: string; name: string | null; email: string | null; image: string | null; role: string; createdAt: string; _count: { communityPosts: number } }
type Like = { userId: string }
type PostUser = { id: string; name: string | null; email: string | null; image: string | null }
type Post = {
  id: string
  imageBase64: string | null
  pair: string | null
  direction: string | null
  outcome: string | null
  pnl: number | null
  description: string | null
  status: string
  aiReason: string | null
  createdAt: string
  user: PostUser
  likes: Like[]
}

type Props = {
  initialPosts: Post[]
  initialUsers: User[]
}

export default function AdminPanel({ initialPosts, initialUsers }: Props) {
  const [tab, setTab] = useState<'posts' | 'users'>('posts')
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [filterStatus, setFilterStatus] = useState<string>('pending')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const updatePostStatus = async (id: string, status: string) => {
    setLoadingId(id)
    try {
      const res = await fetch(`/api/admin/community/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setPosts(prev => prev.map(p => p.id === id ? { ...p, status } : p))
      }
    } finally {
      setLoadingId(null)
    }
  }

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post permanently?')) return
    setLoadingId(id)
    try {
      const res = await fetch(`/api/admin/community/${id}`, { method: 'DELETE' })
      if (res.ok) setPosts(prev => prev.filter(p => p.id !== id))
    } finally {
      setLoadingId(null)
    }
  }

  const updateUserRole = async (id: string, role: string) => {
    setLoadingId(id)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
      }
    } finally {
      setLoadingId(null)
    }
  }

  const STATUS_COLORS: Record<string, string> = {
    pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    approved: 'text-green-400 bg-green-400/10 border-green-400/20',
    rejected: 'text-red-400 bg-red-400/10 border-red-400/20',
  }

  const filteredPosts = filterStatus === 'all' ? posts : posts.filter(p => p.status === filterStatus)

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1 w-fit">
        {(['posts', 'users'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition ${
              tab === t ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t} {t === 'posts' ? `(${posts.length})` : `(${users.length})`}
          </button>
        ))}
      </div>

      {/* Posts tab */}
      {tab === 'posts' && (
        <div>
          {/* Filter */}
          <div className="mb-4 flex gap-1.5">
            {['pending', 'approved', 'rejected', 'all'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`rounded-lg border px-3 py-1 text-xs font-medium capitalize transition ${
                  filterStatus === s
                    ? 'border-zinc-500 bg-zinc-700 text-white'
                    : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredPosts.length === 0 && (
              <p className="py-12 text-center text-sm text-zinc-600">No posts with this status</p>
            )}
            {filteredPosts.map(post => (
              <div key={post.id} className="flex gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                {post.imageBase64 && (
                  <img
                    src={post.imageBase64}
                    alt="chart"
                    className="h-20 w-32 shrink-0 rounded-xl object-cover"
                  />
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-zinc-200">{post.user.name ?? 'Anonymous'}</span>
                    <span className="text-xs text-zinc-600">{post.user.email}</span>
                    <span className={`ml-auto rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${STATUS_COLORS[post.status] ?? 'text-zinc-400 border-zinc-700'}`}>
                      {post.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                    {post.pair && <span className="font-mono">{post.pair}</span>}
                    {post.direction && <span>{post.direction}</span>}
                    {post.outcome && <span>{post.outcome}</span>}
                    {post.pnl != null && <span>{post.pnl}R</span>}
                    <span className="text-zinc-700">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  {post.description && (
                    <p className="text-xs text-zinc-500 line-clamp-2">{post.description}</p>
                  )}
                  {post.aiReason && (
                    <p className="text-[11px] text-zinc-700 italic">AI: {post.aiReason}</p>
                  )}
                  <div className="mt-1 flex gap-1.5 flex-wrap">
                    {post.status !== 'approved' && (
                      <button
                        onClick={() => void updatePostStatus(post.id, 'approved')}
                        disabled={loadingId === post.id}
                        className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs text-green-400 transition hover:bg-green-500/20 disabled:opacity-40"
                      >
                        Approve
                      </button>
                    )}
                    {post.status !== 'rejected' && (
                      <button
                        onClick={() => void updatePostStatus(post.id, 'rejected')}
                        disabled={loadingId === post.id}
                        className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-400 transition hover:bg-yellow-500/20 disabled:opacity-40"
                      >
                        Reject
                      </button>
                    )}
                    <button
                      onClick={() => void deletePost(post.id)}
                      disabled={loadingId === post.id}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500/20 disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users tab */}
      {tab === 'users' && (
        <div className="space-y-2">
          {users.map(user => (
            <div key={user.id} className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              {user.image ? (
                <Image src={user.image} alt={user.name ?? ''} width={36} height={36} className="rounded-full shrink-0" />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-300">
                  {user.name?.charAt(0).toUpperCase() ?? '?'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-200">{user.name ?? 'No name'}</p>
                <p className="text-xs text-zinc-600">{user.email} · {user._count.communityPosts} posts · joined {new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  user.role === 'admin' ? 'border-[#a37b34]/40 text-[#f0d289]' : 'border-zinc-700 text-zinc-500'
                }`}>
                  {user.role}
                </span>
                <select
                  value={user.role}
                  disabled={loadingId === user.id}
                  onChange={e => void updateUserRole(user.id, e.target.value)}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 outline-none disabled:opacity-40"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
