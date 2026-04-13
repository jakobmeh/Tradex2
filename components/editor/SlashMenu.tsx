'use client'
import { useEffect, useState } from 'react'
import { BLOCK_MENU, BlockType } from '@/lib/blocks'

type Props = {
  query: string
  onSelect: (type: BlockType) => void
  onClose: () => void
}

export default function SlashMenu({ query, onSelect, onClose }: Props) {
  const [selected, setSelected] = useState(0)

  const filtered = BLOCK_MENU.filter(b =>
    b.label.toLowerCase().includes(query.toLowerCase()) ||
    b.description.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(p => Math.min(p + 1, filtered.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(p => Math.max(p - 1, 0)) }
      if (e.key === 'Enter')     { e.preventDefault(); if (filtered[selected]) onSelect(filtered[selected].type) }
      if (e.key === 'Escape')    onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [filtered, selected, onSelect, onClose])

  if (filtered.length === 0) return null

  return (
    <div
      className="absolute z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl w-64 overflow-hidden"
      style={{ top: '100%', left: 0 }}>
      <div className="p-1.5 border-b border-zinc-800">
        <p className="text-xs text-zinc-500 px-1">Blocks</p>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {filtered.map((item, i) => (
          <button key={item.type} onClick={() => onSelect(item.type)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors
              ${i === selected ? 'bg-zinc-700 text-white' : 'text-zinc-300 hover:bg-zinc-800'}`}>
            <span className="w-7 h-7 flex items-center justify-center bg-zinc-800 rounded text-xs font-mono shrink-0">
              {item.icon}
            </span>
            <div>
              <p className="text-sm font-medium leading-tight">{item.label}</p>
              <p className="text-xs text-zinc-500">{item.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
