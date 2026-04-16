'use client'

import { useEffect, useRef, useState } from 'react'
import { getOptionStyle, PROPERTY_TYPES, PropertyType, SelectOption } from '@/lib/database'

type Property = {
  id: string
  name: string
  type: string
  config: string
}

type Props = {
  property: Property
  databaseId: string
  onUpdate: (id: string, data: Partial<Property>) => void
  onDelete: (id: string) => void
  compact?: boolean
}

const SWATCHES = [
  { name: 'gray',   bg: '#52525b', ring: '#71717a' },
  { name: 'red',    bg: '#991b1b', ring: '#ef4444' },
  { name: 'orange', bg: '#9a3412', ring: '#f97316' },
  { name: 'yellow', bg: '#854d0e', ring: '#eab308' },
  { name: 'green',  bg: '#166534', ring: '#22c55e' },
  { name: 'blue',   bg: '#1e40af', ring: '#3b82f6' },
  { name: 'purple', bg: '#6b21a8', ring: '#a855f7' },
]

export default function ColumnHeader({
  property,
  databaseId,
  onUpdate,
  onDelete,
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(property.name)
  const [tab, setTab] = useState<'main' | 'options'>('main')
  const [newOptLabel, setNewOptLabel] = useState('')
  const [newOptColor, setNewOptColor] = useState(SWATCHES[0].bg)
  const ref = useRef<HTMLDivElement>(null)
  const newOptInputRef = useRef<HTMLInputElement>(null)
  const colorPickerRef = useRef<HTMLInputElement>(null)

  const config = (() => {
    try { return JSON.parse(property.config) } catch { return {} }
  })()
  const options: SelectOption[] = config.options ?? []

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const saveOptions = (newOptions: SelectOption[]) => {
    const newConfig = JSON.stringify({ ...config, options: newOptions })
    onUpdate(property.id, { config: newConfig })
    fetch(`/api/databases/${databaseId}/properties/${property.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: newConfig }),
    })
  }

  const addOption = () => {
    const label = newOptLabel.trim()
    if (!label) return
    const newOption: SelectOption = { id: crypto.randomUUID(), label, color: newOptColor }
    saveOptions([...options, newOption])
    setNewOptLabel('')
    setNewOptColor(SWATCHES[(options.length + 1) % SWATCHES.length].bg)
    newOptInputRef.current?.focus()
  }

  const removeOption = (id: string) => {
    saveOptions(options.filter((o) => o.id !== id))
  }

  const saveName = () => {
    onUpdate(property.id, { name })
    fetch(`/api/databases/${databaseId}/properties/${property.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
  }

  const changeType = (type: PropertyType) => {
    onUpdate(property.id, { type })
    fetch(`/api/databases/${databaseId}/properties/${property.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    })
    setOpen(false)
  }

  const typeInfo = PROPERTY_TYPES.find((t) => t.type === property.type)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={`flex w-full items-center gap-1.5 truncate text-[#a89060] transition-colors hover:text-[#f0ddb8] ${
          compact ? 'px-1 py-1 text-[11px]' : 'px-2 py-1.5 text-xs'
        }`}
      >
        <span className="shrink-0 text-[#7a6240]">{typeInfo?.icon}</span>
        <span className="truncate">{property.name}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 w-60 overflow-hidden rounded-2xl border border-[#3a2e18] bg-[#0d0b08] shadow-2xl shadow-black/60">
          {/* Name input */}
          <div className="border-b border-[#2a2010] p-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => e.key === 'Enter' && saveName()}
              className="w-full rounded-xl border border-[#2e2416] bg-[#161008] px-3 py-2 text-sm text-[#f0ddb8] outline-none placeholder:text-[#5a4830] focus:border-[#6a5030]"
              placeholder="Column name"
            />
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#2a2010]">
            {(['main', 'options'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${
                  tab === t ? 'text-[#d4a84b]' : 'text-[#5a4830] hover:text-[#a88a50]'
                }`}
              >
                {t === 'main' ? 'Type' : 'Options'}
                {tab === t && <div className="mx-auto mt-1 h-px w-6 rounded-full bg-[#d4a84b]" />}
              </button>
            ))}
          </div>

          {/* Type list */}
          {tab === 'main' && (
            <div className="max-h-52 overflow-y-auto p-1.5">
              {PROPERTY_TYPES.map((pt) => {
                const isActive = property.type === pt.type
                return (
                  <button
                    key={pt.type}
                    onClick={() => changeType(pt.type)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-[linear-gradient(180deg,rgba(180,130,40,0.14),rgba(100,70,15,0.16))] text-[#f0ddb8]'
                        : 'text-[#8a7050] hover:bg-[#141008] hover:text-[#d4c090]'
                    }`}
                  >
                    <span className={`w-5 text-center text-sm ${isActive ? 'text-[#d4a84b]' : 'text-[#6a5530]'}`}>
                      {pt.icon}
                    </span>
                    <span>{pt.label}</span>
                    {isActive && (
                      <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-[#d4a84b]/20">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4L3.5 6L6.5 2" stroke="#d4a84b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Options tab */}
          {tab === 'options' && (
            <div className="flex flex-col">
              {['select', 'multi_select'].includes(property.type) ? (
                <>
                  {/* Existing options */}
                  <div className="flex max-h-44 flex-col gap-1 overflow-y-auto p-2">
                    {options.length === 0 && (
                      <p className="px-1 py-2 text-xs text-[#4a3a22]">No options yet. Add one below.</p>
                    )}
                    {options.map((opt) => (
                      <div
                        key={opt.id}
                        className="group flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-[#141008]"
                      >
                        <span
                          className="flex-1 truncate rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={getOptionStyle(opt.color)}
                        >
                          {opt.label}
                        </span>
                        <button
                          onClick={() => removeOption(opt.id)}
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-[#5a3a30] opacity-0 transition group-hover:opacity-100 hover:bg-[#2a1010] hover:text-red-400"
                        >
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                            <line x1="1" y1="1" x2="7" y2="7" />
                            <line x1="7" y1="1" x2="1" y2="7" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add new option */}
                  <div className="flex flex-col gap-2 border-t border-[#2a2010] p-2.5">
                    <input
                      ref={newOptInputRef}
                      value={newOptLabel}
                      onChange={(e) => setNewOptLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addOption()
                        if (e.key === 'Escape') setNewOptLabel('')
                      }}
                      placeholder="Option name…"
                      className="w-full rounded-xl border border-[#2e2416] bg-[#161008] px-3 py-2 text-xs text-[#f0ddb8] outline-none placeholder:text-[#4a3820] focus:border-[#6a5030]"
                    />

                    {/* Color swatches + custom picker */}
                    <div className="flex items-center gap-1.5 px-0.5">
                      {SWATCHES.map((s) => {
                        const isSelected = newOptColor === s.bg
                        return (
                          <button
                            key={s.name}
                            onClick={() => setNewOptColor(s.bg)}
                            title={s.name}
                            className="h-5 w-5 rounded-full transition-transform hover:scale-110"
                            style={{
                              background: s.bg,
                              outline: isSelected ? `2px solid ${s.ring}` : '2px solid transparent',
                              outlineOffset: '2px',
                            }}
                          />
                        )
                      })}

                      {/* Custom color picker */}
                      <div className="relative ml-auto">
                        <button
                          onClick={() => colorPickerRef.current?.click()}
                          title="Custom color"
                          className="flex h-5 w-5 items-center justify-center rounded-full border border-[#3a2e18] transition hover:border-[#6a5030]"
                          style={{
                            background: SWATCHES.some(s => s.bg === newOptColor) ? '#1a1410' : newOptColor,
                            outline: !SWATCHES.some(s => s.bg === newOptColor) ? `2px solid ${newOptColor}` : '2px solid transparent',
                            outlineOffset: '2px',
                          }}
                        >
                          {SWATCHES.some(s => s.bg === newOptColor) && (
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="#6a5030" strokeWidth="1.2" strokeLinecap="round">
                              <circle cx="4" cy="4" r="2.5" />
                              <line x1="4" y1="0.5" x2="4" y2="2" />
                              <line x1="4" y1="6" x2="4" y2="7.5" />
                              <line x1="0.5" y1="4" x2="2" y2="4" />
                              <line x1="6" y1="4" x2="7.5" y2="4" />
                            </svg>
                          )}
                        </button>
                        <input
                          ref={colorPickerRef}
                          type="color"
                          value={newOptColor}
                          onChange={(e) => setNewOptColor(e.target.value)}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                      </div>
                    </div>

                    <button
                      onClick={addOption}
                      disabled={!newOptLabel.trim()}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-[#4a3820] bg-[linear-gradient(180deg,rgba(180,130,40,0.18),rgba(100,70,15,0.20))] px-3 py-1.5 text-xs font-medium text-[#d4a84b] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      + Add option
                    </button>
                  </div>
                </>
              ) : (
                <p className="p-3 text-xs text-[#4a3a22]">No options for this type.</p>
              )}

              {property.type !== 'title' && (
                <div className="border-t border-[#2a2010] p-2">
                  <button
                    onClick={() => { onDelete(property.id); setOpen(false) }}
                    className="flex w-full items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs text-[#8a4040] transition hover:bg-[#1a0a0a] hover:text-red-400"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                      <polyline points="1,3 9,3" />
                      <path d="M2,3 L2.5,8.5 H7.5 L8,3" />
                      <path d="M3.5,1.5 H6.5" />
                    </svg>
                    Delete property
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
