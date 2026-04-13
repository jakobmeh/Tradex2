'use client'
import { useState, useCallback } from 'react'
import ColumnHeader from './ColumnHeader'
import CellRenderer from './CellRenderer'
import { PROPERTY_TYPES, PropertyType } from '@/lib/database'

type Property = { id: string; name: string; type: string; config: string; order: number }
type Value = { propertyId: string; value: string; property: Property }
type Entry = { id: string; order: number; values: Value[] }
type Database = { id: string; name: string; icon: string | null; properties: Property[]; entries: Entry[] }

export default function DatabaseTable({ initial, embedded = false }: { initial: Database; embedded?: boolean }) {
  const [db, setDb] = useState(initial)
  const [filter, setFilter] = useState('')
  const [addingCol, setAddingCol] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [newColType, setNewColType] = useState<PropertyType>('text')

  const addRow = async () => {
    const res = await fetch(`/api/databases/${db.id}/entries`, { method: 'POST' })
    const text = await res.text()
    const entry = text ? safeParseJson(text) as Entry | null : null
    if (!res.ok || !entry?.id) {
      throw new Error('Failed to create row')
    }
    setDb(p => ({ ...p, entries: [...p.entries, entry] }))
  }

  const deleteRow = async (id: string) => {
    setDb(p => ({ ...p, entries: p.entries.filter(e => e.id !== id) }))
    await fetch(`/api/entries/${id}`, { method: 'DELETE' })
  }

  const saveValue = useCallback(async (entryId: string, propertyId: string, value: string) => {
    setDb(p => ({
      ...p,
      entries: p.entries.map(e =>
        e.id === entryId
          ? {
              ...e,
              values: e.values.some(v => v.propertyId === propertyId)
                ? e.values.map(v => v.propertyId === propertyId ? { ...v, value } : v)
                : [...e.values, { propertyId, value, property: p.properties.find(pr => pr.id === propertyId)! }],
            }
          : e
      ),
    }))
    await fetch(`/api/entries/${entryId}/values`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId, value }),
    })
  }, [])

  const updateProperty = useCallback((id: string, data: Partial<Property>) => {
    setDb(p => ({ ...p, properties: p.properties.map(pr => pr.id === id ? { ...pr, ...data } : pr) }))
  }, [])

  const deleteProperty = useCallback(async (id: string) => {
    setDb(p => ({ ...p, properties: p.properties.filter(pr => pr.id !== id) }))
    await fetch(`/api/databases/${db.id}/properties/${id}`, { method: 'DELETE' })
  }, [db.id])

  const addColumn = async () => {
    if (!newColName.trim()) return
    const res = await fetch(`/api/databases/${db.id}/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newColName, type: newColType }),
    })
    const prop: Property = await res.json()
    setDb(p => ({ ...p, properties: [...p.properties, prop] }))
    setNewColName('')
    setAddingCol(false)
  }

  const updateDbName = async (name: string) => {
    setDb(p => ({ ...p, name }))
    await fetch(`/api/databases/${db.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
  }

  const filtered = db.entries.filter(entry => {
    if (!filter) return true
    return entry.values.some(v => v.value.toLowerCase().includes(filter.toLowerCase()))
  })

  return (
    <div className={`flex flex-col ${embedded ? 'overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60' : 'h-full'}`}>
      {/* header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800">
        <span className="text-2xl">{db.icon ?? '🗄️'}</span>
        <input value={db.name} onChange={e => updateDbName(e.target.value)}
          className="text-xl font-semibold text-white bg-transparent outline-none" />
      </div>

      {/* toolbar */}
      <div className="flex items-center gap-3 px-6 py-2 border-b border-zinc-800">
        <input value={filter} onChange={e => setFilter(e.target.value)}
          placeholder="Filter..." className="bg-zinc-800 text-sm px-3 py-1.5 rounded text-white outline-none w-48" />
        <span className="text-xs text-zinc-500 ml-auto">{filtered.length} rows</span>
      </div>

      {/* table */}
      <div className={`overflow-auto ${embedded ? '' : 'flex-1'}`}>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="w-8 px-2 py-1.5 text-left">
                <span className="text-zinc-600 text-xs">#</span>
              </th>
              {db.properties.map(prop => (
                <th key={prop.id} className="border-r border-zinc-800 min-w-[140px] text-left">
                  <ColumnHeader
                    property={prop}
                    databaseId={db.id}
                    onUpdate={updateProperty}
                    onDelete={deleteProperty}
                  />
                </th>
              ))}
              {/* add column */}
              <th className="px-2">
                {addingCol ? (
                  <div className="flex items-center gap-1 p-1">
                    <input value={newColName} onChange={e => setNewColName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addColumn()}
                      placeholder="Column name" autoFocus
                      className="bg-zinc-800 text-white text-xs px-2 py-1 rounded outline-none w-28" />
                    <select value={newColType} onChange={e => setNewColType(e.target.value as PropertyType)}
                      className="bg-zinc-800 text-white text-xs px-1 py-1 rounded outline-none">
                      {PROPERTY_TYPES.filter(t => t.type !== 'title').map(pt => (
                        <option key={pt.type} value={pt.type}>{pt.label}</option>
                      ))}
                    </select>
                    <button onClick={addColumn} className="text-xs text-blue-400 hover:text-blue-300">Add</button>
                    <button onClick={() => setAddingCol(false)} className="text-xs text-zinc-500">✕</button>
                  </div>
                ) : (
                  <button onClick={() => setAddingCol(true)}
                    className="text-zinc-500 hover:text-white text-xs px-3 py-1.5 hover:bg-zinc-800 rounded whitespace-nowrap">
                    + Add column
                  </button>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, i) => (
              <tr key={entry.id} className="border-b border-zinc-800 hover:bg-zinc-800/30 group">
                <td className="px-2 py-1 text-zinc-600 text-xs">{i + 1}</td>
                {db.properties.map(prop => {
                  const val = entry.values.find(v => v.propertyId === prop.id)
                  return (
                    <td key={prop.id} className="border-r border-zinc-800 px-2 py-1">
                      <CellRenderer
                        value={val?.value ?? ''}
                        type={prop.type as PropertyType}
                        config={prop.config}
                        entryId={entry.id}
                        propertyId={prop.id}
                        onSave={saveValue}
                      />
                    </td>
                  )
                })}
                <td className="px-2">
                  <button onClick={() => deleteRow(entry.id)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 text-xs transition-opacity">
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* add row */}
        <button onClick={addRow}
          className="flex items-center gap-2 px-4 py-2 text-zinc-500 hover:text-white hover:bg-zinc-800/30 w-full text-sm transition-colors">
          <span>+</span> New row
        </button>
      </div>
    </div>
  )
}

function safeParseJson(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}
