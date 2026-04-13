'use client'

import { useEffect, useRef, useState } from 'react'
import { PropertyType, SELECT_COLORS, SelectOption } from '@/lib/database'

type Props = {
  value: string
  type: PropertyType
  config: string
  entryId: string
  propertyId: string
  onSave: (entryId: string, propertyId: string, value: string) => void
  compact?: boolean
}

export default function CellRenderer({
  value,
  type,
  config,
  entryId,
  propertyId,
  onSave,
  compact = false,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocal(value)
  }, [value])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const textSize = compact ? 'text-xs' : 'text-sm'

  const save = (val: string) => {
    setLocal(val)
    onSave(entryId, propertyId, val)
    setEditing(false)
  }

  const parsedConfig = (() => {
    try {
      return JSON.parse(config)
    } catch {
      return {}
    }
  })()
  const options: SelectOption[] = parsedConfig.options ?? []

  if (type === 'checkbox') {
    const checked = local === 'true'
    return (
      <div className="flex items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => save(String(e.target.checked))}
          className="h-4 w-4 cursor-pointer accent-blue-500"
        />
      </div>
    )
  }

  if (type === 'rating') {
    const num = parseInt(local) || 0
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            onClick={() => save(String(i))}
            className={`${textSize} ${i <= num ? 'text-yellow-400' : 'text-zinc-600'} hover:text-yellow-300`}
          >
            *
          </button>
        ))}
      </div>
    )
  }

  if (type === 'select') {
    const selected = options.find((o) => o.id === local)
    const colorSet = SELECT_COLORS.find((c) => c.name === selected?.color) ?? SELECT_COLORS[0]
    return (
      <div className="relative">
        <button onClick={() => setEditing((p) => !p)} className="w-full truncate text-left">
          {selected ? (
            <span className={`inline-block max-w-full truncate rounded-full px-2 py-0.5 text-xs ${colorSet.bg} ${colorSet.text}`}>
              {selected.label}
            </span>
          ) : (
            <span className={`text-zinc-600 ${textSize}`}>-</span>
          )}
        </button>
        {editing && (
          <div className="absolute top-full left-0 z-50 mt-1 w-48 rounded-lg border border-zinc-700 bg-zinc-900 p-1 shadow-xl">
            <button
              onClick={() => save('')}
              className="w-full rounded px-2 py-1 text-left text-xs text-zinc-400 hover:bg-zinc-800"
            >
              None
            </button>
            {options.map((opt) => {
              const c = SELECT_COLORS.find((x) => x.name === opt.color) ?? SELECT_COLORS[0]
              return (
                <button
                  key={opt.id}
                  onClick={() => save(opt.id)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-zinc-800"
                >
                  <span className={`rounded-full px-2 py-0.5 text-xs ${c.bg} ${c.text}`}>{opt.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  if (type === 'date') {
    if (editing) {
      return (
        <input
          ref={inputRef}
          type="date"
          defaultValue={local}
          onBlur={(e) => save(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save((e.target as HTMLInputElement).value)}
          className={`w-full rounded bg-zinc-800 px-1 text-white outline-none ${textSize}`}
        />
      )
    }

    return (
      <button onClick={() => setEditing(true)} className={`w-full truncate text-left text-zinc-300 hover:text-white ${textSize}`}>
        {local ? new Date(local).toLocaleDateString() : <span className="text-zinc-600">-</span>}
      </button>
    )
  }

  if (type === 'number') {
    if (editing) {
      return (
        <input
          ref={inputRef}
          type="number"
          defaultValue={local}
          onBlur={(e) => save(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save((e.target as HTMLInputElement).value)}
          className={`w-full bg-transparent text-white outline-none ${textSize}`}
        />
      )
    }

    return (
      <button onClick={() => setEditing(true)} className={`w-full truncate text-left text-zinc-300 hover:text-white ${textSize}`}>
        {local || <span className="text-zinc-600">-</span>}
      </button>
    )
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        defaultValue={local}
        onBlur={(e) => save(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && save((e.target as HTMLInputElement).value)}
        className={`w-full bg-transparent text-white outline-none ${textSize}`}
      />
    )
  }

  return (
    <button onClick={() => setEditing(true)} className={`block w-full truncate text-left text-zinc-300 hover:text-white ${textSize}`}>
      {local || <span className="text-zinc-600">Empty</span>}
    </button>
  )
}
