'use client'

import { useCallback, useEffect, useState } from 'react'

type Entry = {
  id: string
  values: Array<{ propertyId: string; value: string; property: { name: string; type: string } }>
}

type Props = {
  databaseId: string
  chartType: string      // 'bar' | 'pie'
  chartTitle: string
  chartGroupBy: string   // column name to group by, or '' for overall
  chartMetric: string    // 'winrate' | 'count'
}

type DataPoint = { label: string; value: number; count: number }

function getColValue(entry: Entry, colName: string): string {
  if (!colName) return ''
  return entry.values.find((v) => v.property.name.toLowerCase() === colName.toLowerCase())?.value ?? ''
}

function buildData(entries: Entry[], groupBy: string, metric: string): DataPoint[] {
  if (entries.length === 0) return []

  // Overall (no grouping)
  if (!groupBy) {
    if (metric === 'count') return [{ label: 'Total', value: entries.length, count: entries.length }]
    if (metric === 'winrate') {
      const wins = entries.filter((e) => {
        const vals = e.values.map((v) => v.value.toLowerCase())
        return vals.includes('win')
      }).length
      return [{ label: 'Win Rate', value: Math.round((wins / entries.length) * 100), count: entries.length }]
    }
    return []
  }

  // Group by a column
  const groups = new Map<string, Entry[]>()
  for (const entry of entries) {
    const key = getColValue(entry, groupBy) || '(empty)'
    const arr = groups.get(key) ?? []
    arr.push(entry)
    groups.set(key, arr)
  }

  return Array.from(groups.entries())
    .map(([label, grouped]) => {
      let value = grouped.length
      if (metric === 'winrate') {
        const wins = grouped.filter((e) => {
          const vals = e.values.map((v) => v.value.toLowerCase())
          return vals.includes('win')
        }).length
        value = Math.round((wins / grouped.length) * 100)
      }
      return { label, value, count: grouped.length }
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 12)
}

const BAR_COLOR = (value: number, metric: string) => {
  if (metric === 'winrate') {
    if (value >= 60) return '#4ade80'
    if (value >= 50) return '#facc15'
    return '#f87171'
  }
  return '#60a5fa'
}

function BarChart({ data, metric }: { data: DataPoint[]; metric: string }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const W = 480
  const H = 200
  const padding = { top: 16, right: 12, bottom: 40, left: 36 }
  const innerW = W - padding.left - padding.right
  const innerH = H - padding.top - padding.bottom
  const barW = Math.min(innerW / data.length - 4, 48)
  const barGap = innerW / data.length

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 200 }}>
      {/* Y-axis gridlines */}
      {[0, 25, 50, 75, 100].filter((v) => v <= max + 10).map((pct) => {
        const y = padding.top + innerH - (pct / max) * innerH
        return (
          <g key={pct}>
            <line
              x1={padding.left}
              y1={y}
              x2={W - padding.right}
              y2={y}
              stroke="#27272a"
              strokeWidth={1}
            />
            <text x={padding.left - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#52525b">
              {metric === 'winrate' ? `${pct}%` : pct}
            </text>
          </g>
        )
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const barH = Math.max((d.value / max) * innerH, 2)
        const x = padding.left + i * barGap + (barGap - barW) / 2
        const y = padding.top + innerH - barH
        const color = BAR_COLOR(d.value, metric)
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={barH} rx={3} fill={color} fillOpacity={0.85} />
            {/* Value label on bar */}
            <text
              x={x + barW / 2}
              y={y - 4}
              textAnchor="middle"
              fontSize={9}
              fill={color}
              fontWeight="600"
            >
              {metric === 'winrate' ? `${d.value}%` : d.value}
            </text>
            {/* X-axis label */}
            <text
              x={x + barW / 2}
              y={padding.top + innerH + 14}
              textAnchor="middle"
              fontSize={9}
              fill="#71717a"
            >
              {d.label.length > 8 ? d.label.slice(0, 7) + '…' : d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function PieChart({ data, metric }: { data: DataPoint[]; metric: string }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return null

  const cx = 80
  const cy = 80
  const r = 64
  const COLORS = ['#4ade80', '#f87171', '#facc15', '#60a5fa', '#a78bfa', '#fb923c']

  let angle = -Math.PI / 2
  const slices = data.map((d, i) => {
    const pct = d.value / total
    const startAngle = angle
    angle += pct * 2 * Math.PI
    const endAngle = angle
    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)
    const large = pct > 0.5 ? 1 : 0
    return { d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, color: COLORS[i % COLORS.length], label: d.label, value: d.value }
  })

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 160 160" className="w-32 h-32 shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={s.d} fill={s.color} fillOpacity={0.85} />
        ))}
      </svg>
      <div className="space-y-1.5">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-zinc-300">{s.label}</span>
            <span className="text-xs text-zinc-500 ml-auto pl-3">
              {metric === 'winrate' ? `${s.value}%` : s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DatabaseChartBlock({ databaseId, chartType, chartTitle, chartGroupBy, chartMetric }: Props) {
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    return () => clearInterval(interval)
  }, [load])

  const data = entries ? buildData(entries, chartGroupBy ?? '', chartMetric ?? 'count') : []

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3 text-sm text-red-400">
        {chartTitle}: error loading data
      </div>
    )
  }

  if (!entries) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 animate-pulse">
        <div className="h-4 w-40 bg-zinc-800 rounded mb-4" />
        <div className="h-40 bg-zinc-800/50 rounded" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-white">{chartTitle}</p>
        <button
          onClick={() => void load()}
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          title="Refresh"
        >
          ↻
        </button>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-zinc-500 text-sm">No data yet</p>
          <p className="text-zinc-600 text-xs mt-1">Add entries to the table to see the chart</p>
        </div>
      ) : chartType === 'pie' ? (
        <PieChart data={data} metric={chartMetric ?? 'count'} />
      ) : (
        <BarChart data={data} metric={chartMetric ?? 'count'} />
      )}
    </div>
  )
}
