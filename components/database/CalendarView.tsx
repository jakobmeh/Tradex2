'use client'

import { useState } from 'react'
import { getOptionStyle, PropertyType, SelectOption } from '@/lib/database'

type Property = { id: string; name: string; type: string; config: string; order: number }
type Value = { propertyId: string; value: string; property: Property }
type Entry = { id: string; order: number; values: Value[] }
type Database = { id: string; name: string; icon: string | null; properties: Property[]; entries: Entry[] }

type Props = {
  db: Database
  filter: string
  saveValue: (entryId: string, propertyId: string, value: string) => void
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

export default function CalendarView({ db, filter, saveValue }: Props) {
  const [today] = useState(() => new Date())
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth())

  const [selectedDatePropId, setSelectedDatePropId] = useState<string>(() => {
    const dateProps = db.properties.filter(p => p.type === 'date')
    if (dateProps.length === 0) return ''
    const withCounts = dateProps.map(p => ({
      id: p.id,
      count: db.entries.filter(e => e.values.some(v => v.propertyId === p.id && v.value)).length,
    }))
    withCounts.sort((a, b) => b.count - a.count)
    return withCounts[0].id
  })

  const [selectedDisplayPropId, setSelectedDisplayPropId] = useState<string>(() => {
    return db.properties.find(p => p.type === 'title')?.id ?? db.properties[0]?.id ?? ''
  })

  const [popup, setPopup] = useState<{ entry: Entry; x: number; y: number } | null>(null)

  const dateProps = db.properties.filter(p => p.type === 'date')
  const displayableProps = db.properties.filter(p => p.type !== 'image')

  const filtered = db.entries.filter(entry => {
    if (!filter) return true
    return entry.values.some(v => v.value.toLowerCase().includes(filter.toLowerCase()))
  })

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function entriesForDay(day: number): Entry[] {
    if (!selectedDatePropId) return []
    const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return filtered.filter(entry =>
      entry.values.some(v => v.propertyId === selectedDatePropId && v.value === isoDate)
    )
  }

  const displayProp = db.properties.find(p => p.id === selectedDisplayPropId)

  function getChipContent(entry: Entry): { label: string; color?: string; style?: React.CSSProperties } {
    if (!displayProp) return { label: 'Untitled' }
    const val = entry.values.find(v => v.propertyId === displayProp.id)?.value ?? ''

    if (displayProp.type === 'select' || displayProp.type === 'multi_select') {
      const config = safeParseJson(displayProp.config) as { options?: SelectOption[] }
      const options: SelectOption[] = config.options ?? []
      const firstId = val.split(',')[0]
      const opt = options.find(o => o.id === firstId)
      if (opt) return { label: opt.label, style: getOptionStyle(opt.color) }
      return { label: val || '-' }
    }

    if (displayProp.type === 'checkbox') return { label: val === 'true' ? '✓' : '✗' }
    if (displayProp.type === 'date') return { label: val ? new Date(val + 'T00:00:00').toLocaleDateString() : '-' }

    const titleProp = db.properties.find(p => p.type === 'title')
    const titleVal = titleProp ? (entry.values.find(v => v.propertyId === titleProp.id)?.value || 'Untitled') : 'Untitled'
    return { label: val ? `${titleVal}: ${val}` : titleVal }
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }
  function goToday() { setYear(today.getFullYear()); setMonth(today.getMonth()) }

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  return (
    <div className="flex flex-1 flex-col overflow-hidden" onClick={() => setPopup(null)}>
      {/* Calendar toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 px-4 py-2">
        <button onClick={prevMonth} className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <polyline points="9,2 4,7 9,12" />
          </svg>
        </button>
        <span className="min-w-[160px] text-center text-sm font-semibold text-white">
          {MONTHS[month]} {year}
        </span>
        <button onClick={nextMonth} className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <polyline points="5,2 10,7 5,12" />
          </svg>
        </button>
        <button onClick={goToday} className="rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white">
          Today
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          {/* Show field selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Show:</span>
            <select
              value={selectedDisplayPropId}
              onChange={e => setSelectedDisplayPropId(e.target.value)}
              className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-white outline-none"
            >
              {displayableProps.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Date field selector */}
          {dateProps.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Date field:</span>
              <select
                value={selectedDatePropId}
                onChange={e => setSelectedDatePropId(e.target.value)}
                className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-white outline-none"
              >
                {dateProps.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          {dateProps.length === 0 && (
            <span className="text-xs text-amber-500">No date field — add one to use calendar view</span>
          )}
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-zinc-800">
        {DAYS.map(d => (
          <div key={d} className="px-3 py-2 text-center text-xs font-medium text-zinc-500">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid flex-1 grid-cols-7 auto-rows-fr overflow-auto">
        {cells.map((day, i) => {
          const dayEntries = day ? entriesForDay(day) : []
          const todayCell = day ? isToday(day) : false
          return (
            <div
              key={i}
              className={`relative min-h-[80px] border-b border-r border-zinc-800 p-1.5 ${
                day ? 'hover:bg-zinc-800/20' : 'bg-zinc-900/40'
              }`}
            >
              {day && (
                <>
                  <span className={`mb-1 flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                    todayCell ? 'bg-blue-600 font-semibold text-white' : 'text-zinc-500'
                  }`}>
                    {day}
                  </span>

                  <div className="flex flex-col gap-0.5">
                    {dayEntries.slice(0, 3).map(entry => {
                      const chip = getChipContent(entry)
                      const hasCustomStyle = !!chip.style
                      return (
                        <button
                          key={entry.id}
                          onClick={e => {
                            e.stopPropagation()
                            const rect = (e.target as HTMLElement).getBoundingClientRect()
                            setPopup({ entry, x: rect.left, y: rect.bottom + 4 })
                          }}
                          style={chip.style}
                          className={`w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] ${
                            hasCustomStyle
                              ? 'hover:opacity-80'
                              : 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/40'
                          }`}
                        >
                          {chip.label}
                        </button>
                      )
                    })}
                    {dayEntries.length > 3 && (
                      <span className="px-1 text-[10px] text-zinc-500">+{dayEntries.length - 3} more</span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Entry popup */}
      {popup && (
        <EntryPopup
          entry={popup.entry}
          x={popup.x}
          y={popup.y}
          properties={db.properties}
          saveValue={saveValue}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  )
}

// ── Entry popup ──────────────────────────────────────────────────────────────

function EntryPopup({
  entry, x, y, properties, saveValue, onClose,
}: {
  entry: Entry
  x: number
  y: number
  properties: Property[]
  saveValue: (entryId: string, propertyId: string, value: string) => void
  onClose: () => void
}) {
  const visibleProps = properties.filter(p => p.type !== 'image').slice(0, 8)

  return (
    <div
      className="fixed z-50 w-72 rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-2xl"
      style={{ left: Math.min(x, window.innerWidth - 300), top: Math.min(y, window.innerHeight - 320) }}
      onClick={e => e.stopPropagation()}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Entry</span>
        <button onClick={onClose} className="rounded p-0.5 text-zinc-500 hover:text-white">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="1" y1="1" x2="9" y2="9" /><line x1="9" y1="1" x2="1" y2="9" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {visibleProps.map(prop => {
          const val = entry.values.find(v => v.propertyId === prop.id)?.value ?? ''
          return (
            <div key={prop.id} className="flex flex-col gap-0.5">
              <span className="text-[10px] text-zinc-500">{prop.name}</span>
              <PopupField
                type={prop.type as PropertyType}
                config={prop.config}
                value={val}
                onSave={v => saveValue(entry.id, prop.id, v)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PopupField({ type, config, value, onSave }: { type: PropertyType; config: string; value: string; onSave: (v: string) => void }) {
  const [local, setLocal] = useState(value)

  const parsedConfig = safeParseJson(config) as { options?: SelectOption[] }
  const options: SelectOption[] = parsedConfig.options ?? []

  if (type === 'checkbox') {
    return (
      <input
        type="checkbox"
        checked={local === 'true'}
        onChange={e => { setLocal(String(e.target.checked)); onSave(String(e.target.checked)) }}
        className="h-4 w-4 accent-blue-500"
      />
    )
  }

  if (type === 'select') {
    return (
      <select
        value={local}
        onChange={e => { setLocal(e.target.value); onSave(e.target.value) }}
        className="w-full rounded bg-zinc-800 px-2 py-1 text-xs text-white outline-none focus:ring-1 focus:ring-blue-600"
      >
        <option value="">None</option>
        {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    )
  }

  if (type === 'date') {
    return (
      <input
        type="date"
        value={local}
        onChange={e => { setLocal(e.target.value); onSave(e.target.value) }}
        className="w-full rounded bg-zinc-800 px-2 py-1 text-xs text-white outline-none focus:ring-1 focus:ring-blue-600"
      />
    )
  }

  if (type === 'number') {
    return (
      <input
        type="number"
        value={local}
        onChange={e => setLocal(e.target.value)}
        onBlur={() => onSave(local)}
        className="w-full rounded bg-zinc-800 px-2 py-1 text-xs text-white outline-none focus:ring-1 focus:ring-blue-600"
      />
    )
  }

  return (
    <input
      type="text"
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => onSave(local)}
      className="w-full rounded bg-zinc-800 px-2 py-1 text-xs text-white outline-none focus:ring-1 focus:ring-blue-600"
    />
  )
}

function safeParseJson(value: string) {
  try { return JSON.parse(value) } catch { return {} }
}
