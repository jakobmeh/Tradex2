'use client'
import { useState, useRef, useEffect } from 'react'
import { PROPERTY_TYPES, PropertyType, SelectOption, SELECT_COLORS } from '@/lib/database'

type Property = {
  id: string; name: string; type: string; config: string
}

type Props = {
  property: Property
  databaseId: string
  onUpdate: (id: string, data: Partial<Property>) => void
  onDelete: (id: string) => void
}

export default function ColumnHeader({ property, databaseId, onUpdate, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(property.name)
  const [tab, setTab] = useState<'main' | 'options'>('main')
  const ref = useRef<HTMLDivElement>(null)
  const config = (() => { try { return JSON.parse(property.config) } catch { return {} } })()
  const options: SelectOption[] = config.options ?? []

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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

  const addOption = () => {
    const label = prompt('Option name:')
    if (!label) return
    const color = SELECT_COLORS[options.length % SELECT_COLORS.length].name
    const newOption: SelectOption = { id: crypto.randomUUID(), label, color }
    const newOptions = [...options, newOption]
    const newConfig = JSON.stringify({ ...config, options: newOptions })
    onUpdate(property.id, { config: newConfig })
    fetch(`/api/databases/${databaseId}/properties/${property.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: newConfig }),
    })
  }

  const typeInfo = PROPERTY_TYPES.find(t => t.type === property.type)

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(p => !p)}
        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white w-full px-2 py-1.5 truncate">
        <span className="text-zinc-500">{typeInfo?.icon}</span>
        <span className="truncate">{property.name}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl w-56 overflow-hidden">
          {/* rename */}
          <div className="p-2 border-b border-zinc-800">
            <input value={name} onChange={e => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={e => e.key === 'Enter' && saveName()}
              className="w-full bg-zinc-800 text-white text-sm px-2 py-1 rounded outline-none" />
          </div>

          {/* tabs */}
          <div className="flex border-b border-zinc-800">
            {['main', 'options'].map(t => (
              <button key={t} onClick={() => setTab(t as 'main' | 'options')}
                className={`flex-1 text-xs py-1.5 capitalize ${tab === t ? 'text-white border-b border-white' : 'text-zinc-500'}`}>
                {t === 'main' ? 'Type' : 'Options'}
              </button>
            ))}
          </div>

          {tab === 'main' && (
            <div className="p-1 max-h-48 overflow-y-auto">
              {PROPERTY_TYPES.map(pt => (
                <button key={pt.type} onClick={() => changeType(pt.type)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-zinc-800
                    ${property.type === pt.type ? 'text-white' : 'text-zinc-400'}`}>
                  <span className="w-5 text-center text-xs">{pt.icon}</span>
                  {pt.label}
                  {property.type === pt.type && <span className="ml-auto text-blue-400 text-xs">✓</span>}
                </button>
              ))}
            </div>
          )}

          {tab === 'options' && (
            <div className="p-2">
              {['select', 'multi_select'].includes(property.type) ? (
                <>
                  <div className="flex flex-col gap-1 mb-2">
                    {options.map(opt => {
                      const c = SELECT_COLORS.find(x => x.name === opt.color) ?? SELECT_COLORS[0]
                      return (
                        <div key={opt.id} className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>{opt.label}</span>
                        </div>
                      )
                    })}
                  </div>
                  <button onClick={addOption}
                    className="text-xs text-blue-400 hover:text-blue-300">+ Add option</button>
                </>
              ) : (
                <p className="text-xs text-zinc-600">No options for this type.</p>
              )}
              <hr className="border-zinc-800 my-2" />
              {property.type !== 'title' && (
                <button onClick={() => { onDelete(property.id); setOpen(false) }}
                  className="text-xs text-red-400 hover:text-red-300">Delete property</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}