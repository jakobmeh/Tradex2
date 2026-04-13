'use client'
import { useState, useRef, useEffect } from 'react'
import { PropertyType, SelectOption, SELECT_COLORS } from '@/lib/database'

type Props = {
  value: string
  type: PropertyType
  config: string
  entryId: string
  propertyId: string
  onSave: (entryId: string, propertyId: string, value: string) => void
}

export default function CellRenderer({ value, type, config, entryId, propertyId, onSave }: Props) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setLocal(value) }, [value])
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const save = (val: string) => {
    setLocal(val)
    onSave(entryId, propertyId, val)
    setEditing(false)
  }

  const parsedConfig = (() => { try { return JSON.parse(config) } catch { return {} } })()
  const options: SelectOption[] = parsedConfig.options ?? []

  if (type === 'checkbox') {
    const checked = local === 'true'
    return (
      <div className="flex items-center justify-center">
        <input type="checkbox" checked={checked}
          onChange={e => save(String(e.target.checked))}
          className="accent-blue-500 w-4 h-4 cursor-pointer" />
      </div>
    )
  }

  if (type === 'rating') {
    const num = parseInt(local) || 0
    return (
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(i => (
          <button key={i} onClick={() => save(String(i))}
            className={`text-sm ${i <= num ? 'text-yellow-400' : 'text-zinc-600'} hover:text-yellow-300`}>
            ★
          </button>
        ))}
      </div>
    )
  }

  if (type === 'select') {
    const selected = options.find(o => o.id === local)
    const colorSet = SELECT_COLORS.find(c => c.name === selected?.color) ?? SELECT_COLORS[0]
    return (
      <div className="relative">
        <button onClick={() => setEditing(p => !p)}
          className="w-full text-left">
          {selected ? (
            <span className={`text-xs px-2 py-0.5 rounded-full ${colorSet.bg} ${colorSet.text}`}>
              {selected.label}
            </span>
          ) : (
            <span className="text-zinc-600 text-sm">—</span>
          )}
        </button>
        {editing && (
          <div className="absolute top-full left-0 z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl w-48 p-1 mt-1">
            <button onClick={() => save('')}
              className="w-full text-left px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 rounded">
              None
            </button>
            {options.map(opt => {
              const c = SELECT_COLORS.find(x => x.name === opt.color) ?? SELECT_COLORS[0]
              return (
                <button key={opt.id} onClick={() => save(opt.id)}
                  className="w-full text-left px-2 py-1 hover:bg-zinc-800 rounded flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>{opt.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  if (type === 'date') {
    if (editing) return (
      <input ref={inputRef} type="date" defaultValue={local}
        onBlur={e => save(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && save((e.target as HTMLInputElement).value)}
        className="bg-zinc-800 text-white text-sm px-1 rounded outline-none w-full" />
    )
    return (
      <button onClick={() => setEditing(true)} className="text-left w-full text-sm text-zinc-300 hover:text-white">
        {local ? new Date(local).toLocaleDateString() : <span className="text-zinc-600">—</span>}
      </button>
    )
  }

  if (type === 'number') {
    if (editing) return (
      <input ref={inputRef} type="number" defaultValue={local}
        onBlur={e => save(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && save((e.target as HTMLInputElement).value)}
        className="bg-transparent text-white text-sm outline-none w-full" />
    )
    return (
      <button onClick={() => setEditing(true)} className="text-left w-full text-sm text-zinc-300 hover:text-white">
        {local || <span className="text-zinc-600">—</span>}
      </button>
    )
  }

  // default: text / title / url / email
  if (editing) return (
    <input ref={inputRef} type="text" defaultValue={local}
      onBlur={e => save(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && save((e.target as HTMLInputElement).value)}
      className="bg-transparent text-white text-sm outline-none w-full" />
  )
  return (
    <button onClick={() => setEditing(true)} className="text-left w-full text-sm text-zinc-300 hover:text-white truncate block">
      {local || <span className="text-zinc-600">Empty</span>}
    </button>
  )
}