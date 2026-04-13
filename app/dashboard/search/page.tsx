'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type Result = {
  id: string
  title: string
  type: 'page' | 'database'
  icon: string | null
  excerpt?: string
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setResults(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200)
    return () => clearTimeout(timer)
  }, [query, search])

  return (
    <div className="max-w-2xl mx-auto py-16 px-8">
      <div className="relative mb-6">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span>
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search pages and databases..."
          className="w-full bg-zinc-900 border border-zinc-700 text-white pl-10 pr-4 py-3 rounded-xl outline-none focus:border-zinc-500 text-base"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {!loading && results.length === 0 && query && (
        <p className="text-zinc-500 text-center py-8">No results for &quot;{query}&quot;</p>
      )}

      {!loading && results.length === 0 && !query && (
        <p className="text-zinc-600 text-center py-8 text-sm">Start typing to search...</p>
      )}

      <div className="flex flex-col gap-1">
        {results.map(r => (
          <Link
            key={r.id}
            href={r.type === 'page' ? `/dashboard/pages/${r.id}` : `/dashboard/databases/${r.id}`}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-zinc-800 transition-colors group"
          >
            <span className="text-xl">{r.icon ?? (r.type === 'page' ? '📄' : '🗄️')}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{r.title || 'Untitled'}</p>
              {r.excerpt && <p className="text-zinc-500 text-xs truncate mt-0.5">{r.excerpt}</p>}
            </div>
            <span className="text-xs text-zinc-600 group-hover:text-zinc-400 capitalize">{r.type}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
