'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useDatabaseRefresh } from '@/lib/database-refresh-context'
import type { ChartConfig } from '@/lib/blocks'

// ── Types ──────────────────────────────────────────────────────────────────

type Entry = {
  id: string
  values: Array<{ propertyId: string; value: string; property: { name: string; type: string; config: string } }>
}

type Property = { id: string; name: string; type: string; config: string }

type DataPoint = { label: string; value: number; count: number }

// ── Data helpers ───────────────────────────────────────────────────────────

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

function getColValue(entry: Entry, colName: string): string {
  if (!colName) return ''
  const v = entry.values.find((v) => v.property.name.toLowerCase() === colName.toLowerCase())
  if (!v) return ''
  return resolveValue(v.value, v.property)
}

function buildData(entries: Entry[], cfg: ChartConfig, properties: Property[]): DataPoint[] {
  if (entries.length === 0) return []
  const { chartGroupBy: groupBy, chartMetric: metric } = cfg

  if (!groupBy) {
    if (metric === 'count') return [{ label: 'Total', value: entries.length, count: entries.length }]
    if (metric === 'winrate') {
      const filled = entries.filter((e) =>
        e.values.some((v) => resolveValue(v.value, v.property).trim() !== '')
      )
      if (!filled.length) return []
      const wins = filled.filter((e) =>
        e.values.some((v) => resolveValue(v.value, v.property).toLowerCase() === 'win')
      ).length
      return [{ label: 'Win Rate', value: Math.round((wins / filled.length) * 100), count: filled.length }]
    }
    return []
  }

  const colLower = groupBy.toLowerCase()
  const groups = new Map<string, Entry[]>()

  for (const entry of entries) {
    let key = getColValue(entry, groupBy)
    if (!key) {
      const fb = entry.values.find(
        (v) => v.property.name.toLowerCase().includes(colLower) || colLower.includes(v.property.name.toLowerCase())
      )
      if (fb) key = resolveValue(fb.value, fb.property)
    }
    if (!key) continue
    const arr = groups.get(key) ?? []
    arr.push(entry)
    groups.set(key, arr)
  }

  // Fill in all select options at 0
  const matchedProp = properties.find(
    (p) => p.name.toLowerCase() === colLower || p.name.toLowerCase().includes(colLower) || colLower.includes(p.name.toLowerCase())
  )
  if (matchedProp && (matchedProp.type === 'select' || matchedProp.type === 'multi_select')) {
    try {
      const cfg2 = JSON.parse(matchedProp.config ?? '{}') as { options?: Array<{ id: string; label: string }> }
      for (const opt of cfg2.options ?? []) {
        if (!groups.has(opt.label)) groups.set(opt.label, [])
      }
    } catch { /* ignore */ }
  }

  if (!groups.size) return []

  return Array.from(groups.entries())
    .map(([label, grouped]) => ({
      label,
      value: metric === 'winrate'
        ? Math.round((grouped.length / entries.length) * 100)
        : grouped.length,
      count: grouped.length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
}

// ── Mini Bar Chart ─────────────────────────────────────────────────────────

function barColor(value: number, metric: string) {
  if (metric === 'winrate') {
    if (value >= 60) return '#4ade80'
    if (value >= 50) return '#facc15'
    return '#f87171'
  }
  return '#60a5fa'
}

function MiniBarChart({ data, metric }: { data: DataPoint[]; metric: string }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const W = 240
  const H = 100
  const pad = { top: 14, right: 6, bottom: 26, left: 22 }
  const iW = W - pad.left - pad.right
  const iH = H - pad.top - pad.bottom
  const bW = Math.min(iW / data.length - 3, 32)
  const gap = iW / data.length

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 100 }}>
      {[0, 50, 100].filter((v) => v <= max + 5).map((pct) => {
        const y = pad.top + iH - (pct / max) * iH
        return (
          <g key={pct}>
            <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="#27272a" strokeWidth={1} />
            <text x={pad.left - 3} y={y + 3} textAnchor="end" fontSize={7} fill="#52525b">
              {metric === 'winrate' ? `${pct}%` : pct}
            </text>
          </g>
        )
      })}
      {data.map((d, i) => {
        const bH = (d.value / max) * iH
        const x = pad.left + i * gap + (gap - bW) / 2
        const y = pad.top + iH - bH
        const color = barColor(d.value, metric)
        return (
          <g key={d.label}>
            {bH > 0 && <rect x={x} y={y} width={bW} height={bH} rx={2} fill={color} fillOpacity={0.85} />}
            {bH > 0 && (
              <text x={x + bW / 2} y={y - 3} textAnchor="middle" fontSize={7} fill={color} fontWeight="600">
                {metric === 'winrate' ? `${d.value}%` : d.value}
              </text>
            )}
            <text x={x + bW / 2} y={pad.top + iH + 10} textAnchor="middle" fontSize={7} fill="#71717a">
              {d.label.length > 7 ? d.label.slice(0, 6) + '…' : d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function MiniPieChart({ data, metric }: { data: DataPoint[]; metric: string }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) return null
  const cx = 40, cy = 40, r = 32
  const COLORS = ['#4ade80', '#f87171', '#facc15', '#60a5fa', '#a78bfa', '#fb923c']
  let angle = -Math.PI / 2
  const slices = data.map((d, i) => {
    const pct = d.value / total
    const start = angle
    angle += pct * 2 * Math.PI
    const end = angle
    const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start)
    const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end)
    return { path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${x2} ${y2} Z`, color: COLORS[i % COLORS.length], label: d.label, value: d.value }
  })
  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 80 80" className="w-16 h-16 shrink-0">
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} fillOpacity={0.85} />)}
      </svg>
      <div className="space-y-0.5 min-w-0">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 min-w-0">
            <div className="h-2 w-2 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-[10px] text-zinc-300 truncate">{s.label}</span>
            <span className="text-[10px] text-zinc-500 ml-auto pl-1 shrink-0">
              {metric === 'winrate' ? `${s.value}%` : s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Single chart slot ──────────────────────────────────────────────────────

function ChartSlot({
  cfg,
  entries,
  properties,
  onRemove,
}: {
  cfg: ChartConfig
  entries: Entry[]
  properties: Property[]
  onRemove: () => void
}) {
  const data = buildData(entries, cfg, properties)

  return (
    <div className="group relative rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 flex flex-col gap-1 min-w-0">
      <div className="flex items-center justify-between gap-1 mb-1">
        <p className="text-[11px] font-medium text-white truncate">{cfg.chartTitle}</p>
        <button
          onClick={onRemove}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-400 text-xs leading-none"
          title="Remove chart"
        >
          ✕
        </button>
      </div>
      {data.length === 0 ? (
        <div className="flex items-center justify-center py-4">
          <p className="text-zinc-600 text-[10px]">No data</p>
        </div>
      ) : cfg.chartType === 'pie' ? (
        <MiniPieChart data={data} metric={cfg.chartMetric} />
      ) : (
        <MiniBarChart data={data} metric={cfg.chartMetric} />
      )}
    </div>
  )
}

// ── Add chart slot ─────────────────────────────────────────────────────────

function AddChartSlot({
  databaseId,
  onAdd,
}: {
  databaseId: string
  onAdd: (cfg: ChartConfig) => void
}) {
  const [open, setOpen] = useState(false)
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30)
  }, [open])

  const submit = async () => {
    if (!desc.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc.trim(), databaseId }),
      })
      if (!res.ok) throw new Error('AI error')
      const cfg = await res.json() as ChartConfig
      onAdd(cfg)
      setDesc('')
      setOpen(false)
    } catch {
      setError('Could not generate chart — try again')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 hover:bg-zinc-800/50 hover:border-zinc-500 transition-colors flex flex-col items-center justify-center gap-1.5 py-6 px-3 w-full"
      >
        <span className="text-zinc-500 text-xl leading-none">+</span>
        <span className="text-[11px] text-zinc-600">Add chart</span>
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-600 bg-zinc-900/80 p-3 flex flex-col gap-2">
      <p className="text-[11px] font-medium text-zinc-300">Describe the chart</p>
      <input
        ref={inputRef}
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void submit()
          if (e.key === 'Escape') { setOpen(false); setDesc('') }
        }}
        placeholder="e.g. Win rate, Count by Result, P&L by Setup…"
        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-2.5 py-1.5 text-[11px] text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
      />
      {error && <p className="text-[10px] text-red-400">{error}</p>}
      <div className="flex gap-1.5">
        <button
          onClick={() => void submit()}
          disabled={loading || !desc.trim()}
          className="flex-1 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 text-[11px] text-white py-1.5 transition-colors"
        >
          {loading ? '…' : 'Generate'}
        </button>
        <button
          onClick={() => { setOpen(false); setDesc('') }}
          className="px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

type Props = {
  databaseId: string
  pageId: string
  charts: (ChartConfig | null)[]
  onUpdate: (charts: (ChartConfig | null)[], databaseId: string) => void
}

export default function DatabaseChartRowBlock({ databaseId: initialDbId, pageId, charts, onUpdate }: Props) {
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [databaseId, setDatabaseId] = useState(initialDbId)
  const [loadingDb, setLoadingDb] = useState(!initialDbId)
  const { subscribe } = useDatabaseRefresh()

  // Auto-discover database from page if none set
  useEffect(() => {
    if (databaseId) return
    async function discover() {
      try {
        const res = await fetch(`/api/pages/${pageId}/blocks`)
        if (!res.ok) return
        const data = await res.json() as Array<{ type: string; content: string | null }>
        for (const block of Array.isArray(data) ? data : []) {
          if (block.type === 'database_table') {
            try {
              const c = JSON.parse(block.content ?? '{}') as { databaseId?: string }
              if (c.databaseId) {
                setDatabaseId(c.databaseId)
                onUpdate(charts, c.databaseId)
                return
              }
            } catch { /* ignore */ }
          }
        }
      } finally {
        setLoadingDb(false)
      }
    }
    void discover()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId])

  const load = useCallback(async () => {
    if (!databaseId) return
    try {
      const res = await fetch(`/api/databases/${databaseId}`)
      if (!res.ok) return
      const data = await res.json() as { entries: Entry[]; properties: Property[] }
      setEntries(data.entries ?? [])
      setProperties(data.properties ?? [])
    } catch { /* ignore */ }
  }, [databaseId])

  useEffect(() => {
    if (!databaseId) return
    void load()
    const interval = setInterval(() => void load(), 30_000)
    const unsub = subscribe(databaseId, () => void load())
    return () => { clearInterval(interval); unsub() }
  }, [load, subscribe, databaseId])

  const addChart = (cfg: ChartConfig) => {
    const next = [...charts]
    const emptyIdx = next.findIndex((c) => c === null)
    if (emptyIdx !== -1) {
      next[emptyIdx] = cfg
    } else {
      next.push(cfg)
    }
    onUpdate(next, databaseId)
  }

  const removeChart = (idx: number) => {
    const next = [...charts]
    next[idx] = null
    // Trim trailing nulls
    while (next.length > 0 && next[next.length - 1] === null) next.pop()
    onUpdate(next, databaseId)
  }

  const filledCharts = charts.filter((c): c is ChartConfig => c !== null)
  const showAddSlot = filledCharts.length < 4

  if (loadingDb) {
    return (
      <div className="grid grid-cols-4 gap-3 animate-pulse">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/40 h-[130px]" />
        ))}
      </div>
    )
  }

  if (!databaseId) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 px-4 py-6 text-center">
        <p className="text-sm text-zinc-500">No table found on this page.</p>
        <p className="text-xs text-zinc-600 mt-1">Add a table block first, then insert a Chart Row.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      {charts.map((cfg, i) =>
        cfg ? (
          <ChartSlot
            key={i}
            cfg={cfg}
            entries={entries ?? []}
            properties={properties}
            onRemove={() => removeChart(i)}
          />
        ) : null
      )}
      {showAddSlot && (
        <AddChartSlot databaseId={databaseId} onAdd={addChart} />
      )}
    </div>
  )
}
