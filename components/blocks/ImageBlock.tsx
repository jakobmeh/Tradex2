'use client'

import { useRef, useState, useCallback } from 'react'
import { BlockContent } from '@/lib/blocks'

type Props = {
  content: BlockContent
  onUpdate: (content: BlockContent) => void
}

export default function ImageBlock({ content, onUpdate }: Props) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => {
      const url = e.target?.result as string
      onUpdate({ ...content, url })
    }
    reader.readAsDataURL(file)
  }, [content, onUpdate])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) loadFile(file)
  }, [loadFile])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const file = Array.from(e.clipboardData.items)
      .find(i => i.type.startsWith('image/'))
      ?.getAsFile()
    if (file) loadFile(file)
  }, [loadFile])

  if (content.url) {
    return (
      <div className="group relative">
        <img
          src={content.url}
          alt={content.caption ?? ''}
          className="w-full rounded-lg object-contain"
        />
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f) }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-md bg-zinc-800/90 px-2 py-1 text-xs text-zinc-300 hover:text-white border border-zinc-700"
          >
            Zamenjaj
          </button>
          <button
            type="button"
            onClick={() => onUpdate({ ...content, url: undefined })}
            className="rounded-md bg-zinc-800/90 px-2 py-1 text-xs text-red-400 hover:text-red-300 border border-zinc-700"
          >
            ✕
          </button>
        </div>
        {content.caption !== undefined && (
          <input
            type="text"
            value={content.caption ?? ''}
            onChange={e => onUpdate({ ...content, caption: e.target.value })}
            placeholder="Dodaj opis..."
            className="mt-1 w-full bg-transparent text-center text-xs text-zinc-500 outline-none placeholder:text-zinc-700"
          />
        )}
      </div>
    )
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onPaste={handlePaste}
      tabIndex={0}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors outline-none focus:border-zinc-500 ${
        dragging ? 'border-zinc-400 bg-zinc-800/60' : 'border-zinc-700 bg-zinc-900/40 hover:border-zinc-600'
      }`}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f) }}
      />
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
      <div className="space-y-0.5">
        <p className="text-sm text-zinc-400">Klikni, povleci ali prilepi sliko</p>
        <p className="text-xs text-zinc-600">PNG, JPG, WebP…</p>
      </div>
    </div>
  )
}
