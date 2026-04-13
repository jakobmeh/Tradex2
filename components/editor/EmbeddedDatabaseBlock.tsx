'use client'

import { useEffect, useState } from 'react'
import DatabaseTable from '@/components/database/DatabaseTable'

type Property = { id: string; name: string; type: string; config: string; order: number }
type Value = { propertyId: string; value: string; property: Property }
type Entry = { id: string; order: number; values: Value[] }
type Database = {
  id: string
  name: string
  icon: string | null
  properties: Property[]
  entries: Entry[]
}

type Props = {
  databaseId?: string
}

export default function EmbeddedDatabaseBlock({ databaseId }: Props) {
  const [database, setDatabase] = useState<Database | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!databaseId) return

    let cancelled = false

    async function loadDatabase() {
      setError(null)
      const res = await fetch(`/api/databases/${databaseId}`)

      if (!res.ok) {
        if (!cancelled) setError('Failed to load database.')
        return
      }

      const data: Database = await res.json()
      if (!cancelled) setDatabase(data)
    }

    void loadDatabase()

    return () => {
      cancelled = true
    }
  }, [databaseId])

  if (!databaseId) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-400">
        This table block is not linked to a database yet.
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
        {error}
      </div>
    )
  }

  if (!database) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <div className="h-5 w-5 bg-zinc-800 rounded" />
          <div className="h-4 w-36 bg-zinc-800 rounded" />
        </div>
        {/* Column header */}
        <div className="flex gap-4 px-4 py-2 border-b border-zinc-800">
          {[28, 20, 24].map((w, i) => (
            <div key={i} className="h-3 bg-zinc-800 rounded" style={{ width: `${w}%` }} />
          ))}
        </div>
        {/* Row skeletons */}
        {[72, 55, 80, 48, 65].map((w, i) => (
          <div key={i} className="flex gap-4 px-4 py-2.5 border-b border-zinc-800/50">
            <div className="h-3.5 bg-zinc-800/80 rounded" style={{ width: `${w}%` }} />
          </div>
        ))}
        <p className="px-4 py-2 text-xs text-zinc-600">Loading database...</p>
      </div>
    )
  }

  return <DatabaseTable initial={database} embedded />
}
