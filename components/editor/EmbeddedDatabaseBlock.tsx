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
      <div className="flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 py-10">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
      </div>
    )
  }

  return <DatabaseTable initial={database} embedded />
}
