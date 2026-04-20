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
    const timer = setTimeout(() => void search(query), 200)
    return () => clearTimeout(timer)
  }, [query, search])

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8 sm:py-12">
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-widest text-[#b99652]/60">Workspace</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Search</h1>
      </div>

      <div className="relative mb-4">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M10 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM9.5 10.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search pages and databases…"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-[#6f592d]/60 focus:ring-1 focus:ring-[#6f592d]/20"
        />
        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
          </div>
        )}
      </div>

      {!loading && results.length === 0 && query && (
        <p className="py-10 text-center text-sm text-zinc-600">No results for &quot;{query}&quot;</p>
      )}
      {!loading && !query && (
        <p className="py-10 text-center text-sm text-zinc-700">Start typing to search…</p>
      )}

      {results.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-zinc-800">
          {results.map((r, i) => (
            <Link
              key={r.id}
              href={r.type === 'page' ? `/dashboard/pages/${r.id}` : `/dashboard/databases/${r.id}`}
              className={`flex items-center gap-3 px-4 py-3 transition hover:bg-zinc-800/60 ${i !== 0 ? 'border-t border-zinc-800' : ''}`}
            >
              <span className="text-lg shrink-0">{r.icon ?? (r.type === 'page' ? '📄' : '🗄️')}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-100">{r.title || 'Untitled'}</p>
                {r.excerpt && <p className="mt-0.5 truncate text-xs text-zinc-600">{r.excerpt}</p>}
              </div>
              <span className="shrink-0 rounded-md border border-zinc-700 px-1.5 py-0.5 text-[10px] capitalize text-zinc-500">{r.type}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
