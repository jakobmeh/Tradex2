'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getOptionStyle, PropertyType, SelectOption } from '@/lib/database'

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
    return (
      <div className="relative">
        <button onClick={() => setEditing((p) => !p)} className="w-full truncate text-left">
          {selected ? (
            <span
              className="inline-block max-w-full truncate rounded-full px-2 py-0.5 text-xs"
              style={getOptionStyle(selected.color)}
            >
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
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => save(opt.id)}
                className="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-zinc-800"
              >
                <span
                  className="rounded-full px-2 py-0.5 text-xs"
                  style={getOptionStyle(opt.color)}
                >
                  {opt.label}
                </span>
              </button>
            ))}
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

  if (type === 'image') {
    return <ImageCell value={local} onSave={(v) => save(v)} />
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

// ── Image cell ─────────────────────────────────────────────────────────────

function ImageCell({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [pasting, setPasting] = useState(false)
  const [lightbox, setLightbox] = useState(false)
  const zoneRef = useRef<HTMLDivElement>(null)

  // When paste zone is open, listen for Ctrl+V / paste events
  useEffect(() => {
    if (!pasting) return
    const handler = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (!file) continue
          const reader = new FileReader()
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              onSave(reader.result)
              setPasting(false)
            }
          }
          reader.readAsDataURL(file)
          e.preventDefault()
          break
        }
      }
    }
    window.addEventListener('paste', handler)
    return () => window.removeEventListener('paste', handler)
  }, [pasting, onSave])

  // Close paste zone on outside click
  useEffect(() => {
    if (!pasting) return
    const handler = (e: MouseEvent) => {
      if (zoneRef.current && !zoneRef.current.contains(e.target as Node)) {
        setPasting(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pasting])

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightbox) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox])

  if (value) {
    return (
      <>
        <button
          onClick={() => setLightbox(true)}
          className="flex items-center justify-center w-full h-8 overflow-hidden rounded"
          title="Click to view"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="screenshot" className="max-h-8 max-w-full object-contain rounded" />
        </button>

        {lightbox && createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setLightbox(false)}
          >
            <div
              className="relative max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="screenshot"
                className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl object-contain"
              />
              <button
                onClick={() => setLightbox(false)}
                className="absolute -top-3 -right-3 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 border border-zinc-600 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors shadow-lg text-sm"
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>
          </div>,
          document.body
        )}
      </>
    )
  }

  if (pasting) {
    return (
      <div
        ref={zoneRef}
        className="flex items-center justify-center rounded-lg border border-dashed border-zinc-500 bg-zinc-800/60 px-2 py-1.5 text-[10px] text-zinc-400 cursor-default select-none"
      >
        Press Ctrl+V to paste
      </div>
    )
  }

  return (
    <button
      onClick={() => setPasting(true)}
      className="flex items-center justify-center gap-1 w-full text-zinc-600 hover:text-zinc-400 transition-colors"
      title="Click then Ctrl+V to paste image"
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="1" width="11" height="11" rx="2" />
        <circle cx="4.5" cy="4.5" r="1" fill="currentColor" stroke="none" />
        <polyline points="1,9 4,6 6,8 8.5,5.5 12,9" />
      </svg>
    </button>
  )
}
