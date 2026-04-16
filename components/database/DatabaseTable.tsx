'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import CellRenderer from './CellRenderer'
import ColumnHeader from './ColumnHeader'
import { PROPERTY_TYPES, PropertyType } from '@/lib/database'
import { useDatabaseRefresh } from '@/lib/database-refresh-context'

type Property = { id: string; name: string; type: string; config: string; order: number }
type Value = { propertyId: string; value: string; property: Property }
type Entry = { id: string; order: number; values: Value[] }
type Database = { id: string; name: string; icon: string | null; properties: Property[]; entries: Entry[] }

export default function DatabaseTable({ initial, embedded = false }: { initial: Database; embedded?: boolean }) {
  const [db, setDb] = useState(initial)
  const { notify } = useDatabaseRefresh()
  const [filter, setFilter] = useState('')
  const [addingCol, setAddingCol] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [newColType, setNewColType] = useState<PropertyType>('text')
  const [addingRow, setAddingRow] = useState(false)
  const colFormRef = useRef<HTMLDivElement>(null)
  const colInputRef = useRef<HTMLInputElement>(null)

  // Close column form on outside click
  useEffect(() => {
    if (!addingCol) return
    const handler = (e: MouseEvent) => {
      if (colFormRef.current && !colFormRef.current.contains(e.target as Node)) {
        setAddingCol(false)
        setNewColName('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [addingCol])

  // Focus input when dropdown opens
  useEffect(() => {
    if (addingCol) {
      setTimeout(() => colInputRef.current?.focus(), 0)
    }
  }, [addingCol])

  const addRow = async () => {
    if (addingRow) return
    setAddingRow(true)

    // Optimistic: add temp row immediately
    const tempId = `temp_${Date.now()}`
    const tempEntry: Entry = { id: tempId, order: db.entries.length, values: [] }
    setDb(p => ({ ...p, entries: [...p.entries, tempEntry] }))

    try {
      const res = await fetch(`/api/databases/${db.id}/entries`, { method: 'POST' })
      const text = await res.text()
      const entry = text ? (safeParseJson(text) as Entry | null) : null
      if (!res.ok || !entry?.id) throw new Error('Failed to create row')

      // Replace temp with real
      setDb(p => ({
        ...p,
        entries: p.entries.map(e => e.id === tempId ? entry : e),
      }))
    } catch {
      // Rollback
      setDb(p => ({ ...p, entries: p.entries.filter(e => e.id !== tempId) }))
    } finally {
      setAddingRow(false)
    }
  }

  const deleteRow = async (id: string) => {
    setDb((p) => ({ ...p, entries: p.entries.filter((e) => e.id !== id) }))
    if (!id.startsWith('temp_')) {
      await fetch(`/api/entries/${id}`, { method: 'DELETE' })
    }
  }

  const saveValue = useCallback(async (entryId: string, propertyId: string, value: string) => {
    setDb((p) => ({
      ...p,
      entries: p.entries.map((e) =>
        e.id === entryId
          ? {
              ...e,
              values: e.values.some((v) => v.propertyId === propertyId)
                ? e.values.map((v) => (v.propertyId === propertyId ? { ...v, value } : v))
                : [...e.values, { propertyId, value, property: p.properties.find((pr) => pr.id === propertyId)! }],
            }
          : e
      ),
    }))
    if (!entryId.startsWith('temp_')) {
      await fetch(`/api/entries/${entryId}/values`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, value }),
      })
      notify(db.id)
    }
  }, [db.id, notify])

  const updateProperty = useCallback((id: string, data: Partial<Property>) => {
    setDb((p) => ({ ...p, properties: p.properties.map((pr) => (pr.id === id ? { ...pr, ...data } : pr)) }))
  }, [])

  const deleteProperty = useCallback(async (id: string) => {
    setDb((p) => ({ ...p, properties: p.properties.filter((pr) => pr.id !== id) }))
    await fetch(`/api/databases/${db.id}/properties/${id}`, { method: 'DELETE' })
  }, [db.id])

  const addColumn = async () => {
    if (!newColName.trim()) {
      colInputRef.current?.focus()
      return
    }
    const name = newColName.trim()
    setAddingCol(false)
    setNewColName('')

    // Optimistic: add temp column
    const tempColId = `temp_col_${Date.now()}`
    const tempProp: Property = { id: tempColId, name, type: newColType, config: '{}', order: db.properties.length }
    setDb(p => ({ ...p, properties: [...p.properties, tempProp] }))

    try {
      const res = await fetch(`/api/databases/${db.id}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type: newColType }),
      })
      const prop: Property = await res.json()
      setDb(p => ({
        ...p,
        properties: p.properties.map(pr => pr.id === tempColId ? prop : pr),
      }))
    } catch {
      // Rollback
      setDb(p => ({ ...p, properties: p.properties.filter(pr => pr.id !== tempColId) }))
    }

    setNewColType('text')
  }

  const updateDbName = async (name: string) => {
    setDb((p) => ({ ...p, name }))
    await fetch(`/api/databases/${db.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
  }

  const filtered = db.entries.filter((entry) => {
    if (!filter) return true
    return entry.values.some((v) => v.value.toLowerCase().includes(filter.toLowerCase()))
  })

  const compact = embedded

  return (
    <div className={`flex flex-col ${embedded ? 'w-full overflow-visible rounded-xl border border-zinc-800 bg-zinc-900/60' : 'h-full'}`}>
      {/* Header */}
      <div className={`flex items-center gap-3 border-b border-zinc-800 ${compact ? 'px-4 py-3' : 'px-6 py-4'}`}>
        <span className={compact ? 'text-xl' : 'text-2xl'}>{db.icon ?? 'D'}</span>
        <input
          value={db.name}
          onChange={(e) => updateDbName(e.target.value)}
          className={`${compact ? 'text-lg' : 'text-xl'} min-w-0 bg-transparent font-semibold text-white outline-none`}
        />
      </div>

      {/* Toolbar */}
      <div className={`flex items-center gap-3 border-b border-zinc-800 ${compact ? 'px-4 py-2' : 'px-6 py-2'}`}>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter..."
          className={`rounded bg-zinc-800 text-white outline-none placeholder:text-zinc-600 ${compact ? 'w-36 px-2 py-1 text-xs' : 'w-48 px-3 py-1.5 text-sm'}`}
        />
        <span className="ml-auto text-xs text-zinc-500">{filtered.length} rows</span>
      </div>

      {/* Table */}
      <div className={embedded ? 'overflow-visible' : 'flex-1 overflow-auto'}>
        <table className={`${compact ? 'w-full table-fixed text-xs' : 'w-full text-sm'} border-collapse`}>
          <thead>
            <tr className="border-b border-zinc-800">
              <th className={`${compact ? 'w-7 px-1 py-1' : 'w-8 px-2 py-1.5'} text-left`}>
                <span className="text-xs text-zinc-600">#</span>
              </th>

              {db.properties.map((prop) => (
                <th
                  key={prop.id}
                  className={`border-r border-zinc-800 text-left ${compact ? 'px-1 py-0.5' : 'min-w-[140px]'} ${
                    prop.id.startsWith('temp_') ? 'opacity-50' : ''
                  }`}
                >
                  <ColumnHeader
                    property={prop}
                    databaseId={db.id}
                    onUpdate={updateProperty}
                    onDelete={deleteProperty}
                    compact={compact}
                  />
                </th>
              ))}

              {/* Add column button + dropdown */}
              <th className={`${compact ? 'w-20 px-1' : 'w-28 px-2'} text-left`}>
                <div ref={colFormRef} className="relative">
                  <button
                    onClick={() => setAddingCol(v => !v)}
                    className={`flex items-center gap-1 rounded font-normal transition-colors ${
                      addingCol
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-500 hover:bg-zinc-800 hover:text-white'
                    } ${compact ? 'px-1.5 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'}`}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <line x1="5" y1="1" x2="5" y2="9" />
                      <line x1="1" y1="5" x2="9" y2="5" />
                    </svg>
                    {compact ? 'Col' : 'Add column'}
                  </button>

                  {addingCol && (
                    <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-xl">
                      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">New column</p>
                      <input
                        ref={colInputRef}
                        value={newColName}
                        onChange={(e) => setNewColName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void addColumn()
                          if (e.key === 'Escape') { setAddingCol(false); setNewColName('') }
                        }}
                        placeholder="Column name"
                        className="mb-2 w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500"
                      />
                      <select
                        value={newColType}
                        onChange={(e) => setNewColType(e.target.value as PropertyType)}
                        className="mb-3 w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-white outline-none focus:border-zinc-500"
                      >
                        {PROPERTY_TYPES.filter((t) => t.type !== 'title').map((pt) => (
                          <option key={pt.type} value={pt.type}>{pt.label}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => void addColumn()}
                          className="flex-1 rounded bg-blue-600 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-500"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => { setAddingCol(false); setNewColName('') }}
                          className="rounded border border-zinc-700 px-2 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((entry, i) => (
              <tr
                key={entry.id}
                className={`group border-b border-zinc-800 transition-colors hover:bg-zinc-800/30 ${
                  entry.id.startsWith('temp_') ? 'opacity-50' : ''
                }`}
              >
                <td className={`${compact ? 'px-1 py-1' : 'px-2 py-1'} text-xs text-zinc-600`}>{i + 1}</td>
                {db.properties.map((prop) => {
                  const val = entry.values.find((v) => v.propertyId === prop.id)
                  return (
                    <td key={prop.id} className={`border-r border-zinc-800 ${compact ? 'px-1 py-1' : 'px-2 py-1'}`}>
                      <CellRenderer
                        value={val?.value ?? ''}
                        type={prop.type as PropertyType}
                        config={prop.config}
                        entryId={entry.id}
                        propertyId={prop.id}
                        onSave={saveValue}
                        compact={compact}
                      />
                    </td>
                  )
                })}
                <td className={compact ? 'px-1' : 'px-2'}>
                  <button
                    onClick={() => deleteRow(entry.id)}
                    className="flex h-5 w-5 items-center justify-center rounded text-zinc-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-950/60 hover:text-red-400"
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <line x1="1" y1="1" x2="7" y2="7" />
                      <line x1="7" y1="1" x2="1" y2="7" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add row button */}
        <button
          onClick={() => void addRow()}
          disabled={addingRow}
          className={`group flex w-full items-center gap-2 border-t border-transparent text-zinc-500 transition-colors hover:border-zinc-800 hover:bg-zinc-800/20 hover:text-white ${
            compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
          } ${addingRow ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <span className="flex h-4 w-4 items-center justify-center rounded border border-zinc-700 text-[10px] transition-colors group-hover:border-zinc-500">
            +
          </span>
          New row
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
