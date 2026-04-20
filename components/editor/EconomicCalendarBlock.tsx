'use client'

import { useEffect, useState, useCallback } from 'react'

type CalEvent = {
  country: string
  event: string
  impact: string
  time: string
  actual: string | null
  estimate: string | null
  prev: string | null
  unit: string | null
}

const IMPACT_STYLE: Record<string, { dot: string; label: string }> = {
  high:   { dot: 'bg-red-500',    label: 'High' },
  medium: { dot: 'bg-orange-400', label: 'Med' },
  low:    { dot: 'bg-yellow-400', label: 'Low' },
}

const COUNTRY_FLAG: Record<string, string> = {
  US: '🇺🇸', EU: '🇪🇺', GB: '🇬🇧', JP: '🇯🇵', CA: '🇨🇦',
  AU: '🇦🇺', NZ: '🇳🇿', CH: '🇨🇭', CN: '🇨🇳', DE: '🇩🇪',
  FR: '🇫🇷', IT: '🇮🇹', ES: '🇪🇸', KR: '🇰🇷', IN: '🇮🇳',
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

function groupByDate(events: CalEvent[]) {
  const groups: Record<string, CalEvent[]> = {}
  for (const e of events) {
    const day = e.time.split('T')[0] ?? e.time.slice(0, 10)
    if (!groups[day]) groups[day] = []
    groups[day].push(e)
  }
  return groups
}

export default function EconomicCalendarBlock() {
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<'today' | 'week'>('today')
  const [impactFilter, setImpactFilter] = useState<'all' | 'high' | 'medium'>('all')

  const load = useCallback(async (r: 'today' | 'week') => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/news?range=${r}`)
      const data = await res.json() as { events: CalEvent[]; error?: string }
      if (data.error) setError(data.error)
      setEvents(data.events ?? [])
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load(range) }, [range, load])

  const filtered = impactFilter === 'all'
    ? events
    : events.filter(e => e.impact === impactFilter)

  const groups = groupByDate(filtered)

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm">📰</span>
          <span className="text-xs font-semibold text-zinc-300">Economic Calendar</span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Impact filter */}
          {(['all', 'high', 'medium'] as const).map(f => (
            <button key={f} onClick={() => setImpactFilter(f)}
              className={`rounded-lg border px-2 py-0.5 text-[11px] font-medium transition ${
                impactFilter === f
                  ? 'border-[#a37b34]/50 bg-[#a37b34]/15 text-[#f0d289]'
                  : 'border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
              }`}>
              {f === 'all' ? 'All' : f === 'high' ? '🔴 High' : '🟠 Med'}
            </button>
          ))}
          <span className="mx-1 h-3 w-px bg-zinc-700" />
          {/* Range */}
          {(['today', 'week'] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`rounded-lg border px-2 py-0.5 text-[11px] font-medium transition ${
                range === r
                  ? 'border-[#a37b34]/50 bg-[#a37b34]/15 text-[#f0d289]'
                  : 'border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
              }`}>
              {r === 'today' ? 'Today' : 'This week'}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
          </div>
        ) : error?.includes('FINNHUB_API_KEY') ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-zinc-400">API key not configured</p>
            <p className="mt-1 text-xs text-zinc-600">Add <code className="rounded bg-zinc-800 px-1 text-zinc-400">FINNHUB_API_KEY</code> to your .env file</p>
            <a href="https://finnhub.io" target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-[#b99652] hover:text-[#f0d289]">
              Get a free key at finnhub.io →
            </a>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-zinc-600">
            No events {impactFilter !== 'all' ? `with ${impactFilter} impact` : ''} {range === 'today' ? 'today' : 'this week'}
          </div>
        ) : (
          Object.entries(groups).map(([day, dayEvents]) => (
            <div key={day}>
              {/* Day header */}
              <div className="sticky top-0 border-b border-zinc-800 bg-zinc-900 px-4 py-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  {formatDate(day + 'T00:00:00')}
                </p>
              </div>

              {/* Events */}
              {dayEvents.map((ev, i) => {
                const impact = IMPACT_STYLE[ev.impact] ?? { dot: 'bg-zinc-600', label: ev.impact }
                const flag = COUNTRY_FLAG[ev.country] ?? '🌐'
                const hasValues = ev.actual || ev.estimate || ev.prev
                return (
                  <div key={i} className={`flex items-start gap-3 px-4 py-2.5 ${i !== 0 ? 'border-t border-zinc-800/60' : ''} hover:bg-zinc-800/30`}>
                    {/* Time */}
                    <div className="w-12 shrink-0 pt-0.5">
                      <p className="text-[11px] text-zinc-500">{formatTime(ev.time)}</p>
                    </div>

                    {/* Impact dot */}
                    <div className="mt-1.5 shrink-0">
                      <span className={`block h-2 w-2 rounded-full ${impact.dot}`} title={impact.label} />
                    </div>

                    {/* Country + event */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm leading-none">{flag}</span>
                        <span className="text-[11px] font-mono text-zinc-500">{ev.country}</span>
                      </div>
                      <p className="mt-0.5 text-xs font-medium text-zinc-200 leading-snug">{ev.event}</p>
                    </div>

                    {/* Values */}
                    {hasValues && (
                      <div className="shrink-0 text-right space-y-0.5">
                        {ev.actual && (
                          <div>
                            <span className="text-[10px] text-zinc-600">Actual </span>
                            <span className="text-xs font-semibold text-white">{ev.actual}{ev.unit ?? ''}</span>
                          </div>
                        )}
                        {ev.estimate && (
                          <div>
                            <span className="text-[10px] text-zinc-600">Forecast </span>
                            <span className="text-xs text-zinc-400">{ev.estimate}{ev.unit ?? ''}</span>
                          </div>
                        )}
                        {ev.prev && (
                          <div>
                            <span className="text-[10px] text-zinc-600">Prev </span>
                            <span className="text-xs text-zinc-500">{ev.prev}{ev.unit ?? ''}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
