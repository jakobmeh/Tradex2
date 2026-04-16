'use client'

import { useCallback, useEffect, useState } from 'react'
import { useDatabaseRefresh } from '@/lib/database-refresh-context'

type Entry = {
  id: string
  values: Array<{ propertyId: string; value: string; property: { name: string; type: string; config: string } }>
}

type Props = {
  databaseId: string
  statLabel: string
  statFormula: string   // 'winrate' | 'count' | 'sum' | 'average'
  statColumn: string    // column name to compute on
  statFilterValue?: string  // value to count as "win" for winrate
}

/** Resolve a stored value to a human-readable label (handles select option IDs). */
function resolveValue(raw: string, prop: { type: string; config: string }): string {
  if (!raw?.trim()) return ''
  if (prop.type === 'select' || prop.type === 'multi_select') {
    try {
      const cfg = JSON.parse(prop.config ?? '{}') as { options?: Array<{ id: string; label: string }> }
      const opt = cfg.options?.find((o) => o.id === raw)
      return opt?.label ?? raw
    } catch { return raw }
  }
  return raw
}

function computeStat(entries: Entry[], formula: string, column: string, filterValue?: string): number | null {
  if (entries.length === 0) return null

  const vals = entries.map((e) => {
    const v = e.values.find((v) => v.property.name.toLowerCase() === column.toLowerCase())
    if (!v) return ''
    return resolveValue(v.value, v.property)
  })

  if (formula === 'count') return entries.length

  if (formula === 'winrate') {
    const winVal = (filterValue ?? 'Win').toLowerCase()
    const filled = vals.filter((v) => v.trim() !== '')
    if (filled.length === 0) return null
    const wins = filled.filter((v) => v.toLowerCase() === winVal).length
    return Math.round((wins / filled.length) * 100)
  }

  if (formula === 'sum') {
    const nums = vals.map(Number).filter((n) => !isNaN(n))
    return nums.length > 0 ? Math.round(nums.reduce((a, b) => a + b, 0) * 100) / 100 : null
  }

  if (formula === 'average') {
    const nums = vals.map(Number).filter((n) => !isNaN(n))
    if (nums.length === 0) return null
    return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100
  }

  return null
}

function formatValue(value: number | null, formula: string): string {
  if (value === null) return '—'
  if (formula === 'winrate') return `${value}%`
  return String(value)
}

function getColor(value: number | null, formula: string): string {
  if (value === null) return 'text-zinc-400'
  if (formula === 'winrate') {
    if (value >= 60) return 'text-green-400'
    if (value >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }
  return 'text-white'
}

export default function DatabaseStatBlock({ databaseId, statLabel, statFormula, statColumn, statFilterValue }: Props) {
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { subscribe } = useDatabaseRefresh()

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/databases/${databaseId}`)
      if (!res.ok) { setError('Failed to load'); return }
      const data = await res.json() as { entries: Entry[] }
      setEntries(data.entries ?? [])
    } catch {
      setError('Failed to load')
    }
  }, [databaseId])

  useEffect(() => {
    void load()
    const interval = setInterval(() => void load(), 30_000)
    const unsub = subscribe(databaseId, () => void load())
    return () => { clearInterval(interval); unsub() }
  }, [load, subscribe, databaseId])

  const value = entries ? computeStat(entries, statFormula, statColumn, statFilterValue) : null
  const display = formatValue(value, statFormula)
  const color = getColor(value, statFormula)
  const total = entries?.length ?? 0

  if (error) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-red-900/40 bg-red-950/20 px-4 py-2 text-sm text-red-400">
        {statLabel}: error loading data
      </div>
    )
  }

  if (!entries) {
    return (
      <div className="inline-flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-3 animate-pulse">
        <div className="h-8 w-16 bg-zinc-800 rounded" />
        <div className="h-4 w-20 bg-zinc-800 rounded" />
      </div>
    )
  }

  return (
    <div className="inline-flex items-baseline gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-3">
      <span className={`text-3xl font-bold tabular-nums ${color}`}>{display}</span>
      <div>
        <p className="text-sm font-medium text-white">{statLabel}</p>
        <p className="text-xs text-zinc-500">
          {total === 0 ? 'No data yet' : `${total} trade${total !== 1 ? 's' : ''}`}
          {entries && (
            <button
              onClick={() => void load()}
              className="ml-2 text-zinc-600 hover:text-zinc-400 transition-colors"
              title="Refresh"
            >
              ↻
            </button>
          )}
        </p>
      </div>
    </div>
  )
}
