'use client'

import { useEffect, useRef, useState } from 'react'
import { BlockContent, BlockType } from '@/lib/blocks'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

type ChatAction =
  | {
      type: 'create_table'
      tableName?: string
      tableIcon?: string
      columns?: Array<{ name: string; type: string; options?: string[] }>
    }
  | { type: 'add_text'; blockType?: string; text?: string }
  | {
      type: 'add_stat'
      databaseId?: string
      statLabel?: string
      statFormula?: string
      statColumn?: string
      statFilterValue?: string
    }
  | {
      type: 'add_chart'
      databaseId?: string
      chartType?: string
      chartTitle?: string
      chartGroupBy?: string
      chartMetric?: string
    }
  | {
      type: 'remove_blocks'
      blockIds?: string[]
      blockType?: string
      databaseId?: string
      scope?: 'all' | 'first'
    }
  | {
      type: 'compute_stat'
      databaseId?: string
      statFormula?: string
      statColumn?: string
      statFilterValue?: string
    }

type DatabaseRef = { id: string; name: string; columns: string[]; stats?: string }
type BlockRef = { id: string; type: BlockType; databaseId?: string }

type Props = {
  pageId: string
  pageTitle: string
  databaseIds: string[]
  blockRefs: BlockRef[]
  onAddBlock: (type: BlockType, content: BlockContent) => Promise<void>
  onCreateTableFromSchema: (
    name: string,
    icon: string,
    columns: Array<{ name: string; type: string; options?: string[] }>
  ) => Promise<string>
  onDeleteBlocks: (ids: string[]) => Promise<void>
}

const SELECT_COLORS = ['gray', 'red', 'orange', 'yellow', 'green', 'blue', 'purple']

export default function PageChatbot({
  pageTitle,
  databaseIds,
  blockRefs,
  onAddBlock,
  onCreateTableFromSchema,
  onDeleteBlocks,
}: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionsLog, setActionsLog] = useState<string[]>([])
  const [databases, setDatabases] = useState<DatabaseRef[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Re-fetch database info whenever the set of databases on the page changes.
  // This runs on open AND whenever databaseIds changes mid-session (e.g. after creating a table).
  const databaseIdsKey = databaseIds.join(',')
  useEffect(() => {
    if (!open || databaseIds.length === 0) return
    async function fetchDbs() {
      const results = await Promise.all(
        databaseIds.map(async (id) => {
          try {
            const res = await fetch(`/api/databases/${id}`)
            if (!res.ok) return null
            const db = await res.json() as {
              id: string
              name: string
              properties: Array<{ name: string; type: string; config: string }>
              entries: Array<{ values: Array<{ value: string; property: { name: string; type: string; config: string } }> }>
            }

            // Build a stats summary so the AI can answer questions about the data
            const entries = db.entries ?? []
            const statLines: string[] = [`total entries: ${entries.length}`]

            const resolveVal = (raw: string, propConfig: string, propType: string): string => {
              if (!raw?.trim()) return ''
              if (propType === 'select' || propType === 'multi_select') {
                try {
                  const cfg = JSON.parse(propConfig ?? '{}') as { options?: Array<{ id: string; label: string }> }
                  return cfg.options?.find(o => o.id === raw)?.label ?? raw
                } catch { return raw }
              }
              return raw
            }

            for (const prop of db.properties) {
              if (prop.type === 'select' || prop.type === 'multi_select') {
                const dist: Record<string, number> = {}
                for (const entry of entries) {
                  const v = entry.values.find(v => v.property.name === prop.name)
                  if (!v) continue
                  const label = resolveVal(v.value, prop.config, prop.type)
                  if (label) dist[label] = (dist[label] ?? 0) + 1
                }
                if (Object.keys(dist).length > 0) {
                  const distStr = Object.entries(dist).map(([k, v]) => `${k}:${v}`).join(', ')
                  statLines.push(`${prop.name} distribution: {${distStr}}`)
                  const totalFilled = Object.values(dist).reduce((a, b) => a + b, 0)
                  const wins = dist['Win'] ?? dist['win'] ?? dist['WIN'] ?? 0
                  if (wins > 0) statLines.push(`win rate (${prop.name}): ${Math.round((wins / totalFilled) * 100)}% (${wins}/${totalFilled})`)
                }
              } else if (prop.type === 'number') {
                const nums = entries
                  .map(e => Number(e.values.find(v => v.property.name === prop.name)?.value ?? ''))
                  .filter(n => !isNaN(n) && n !== 0)
                if (nums.length > 0) {
                  const sum = nums.reduce((a, b) => a + b, 0)
                  statLines.push(`${prop.name}: sum=${sum}, avg=${Math.round((sum / nums.length) * 100) / 100}`)
                }
              }
            }

            return {
              id: db.id,
              name: db.name,
              columns: db.properties.map((p) => p.name),
              stats: statLines.join('; '),
            }
          } catch { return null }
        })
      )
      setDatabases(results.filter(Boolean) as DatabaseRef[])
    }
    void fetchDbs()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, databaseIdsKey])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60)
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        panelRef.current?.contains(target) ||
        toggleRef.current?.contains(target)
      ) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, actionsLog, loading])

  const resolveDbId = (databaseId: string | undefined, lastCreated: string | null): string | null => {
    if (!databaseId) {
      if (lastCreated) return lastCreated
      if (databases.length === 1) return databases[0].id
      return null
    }
    if (databaseId === '__created__') return lastCreated
    return databaseId
  }

  const findExistingDatabaseByName = (tableName: string | undefined): DatabaseRef | null => {
    if (!tableName) return null
    const wanted = tableName.trim().toLowerCase()
    if (!wanted) return null
    return databases.find((db) => db.name.trim().toLowerCase() === wanted) ?? null
  }

  const executeActions = async (actions: ChatAction[]): Promise<{ log: string[]; messageOverrides: Record<string, string> }> => {
    const log: string[] = []
    const messageOverrides: Record<string, string> = {}
    let lastCreatedDbId: string | null = null

    for (const action of actions) {
      try {
        if (action.type === 'create_table') {
          const name = action.tableName || 'New Table'
          const icon = action.tableIcon || '🗂️'
          const cols = action.columns ?? [{ name: 'Name', type: 'title', options: [] }]

          const existingDb = findExistingDatabaseByName(name)
          if (existingDb) {
            lastCreatedDbId = existingDb.id
            // Add a table block for the existing DB if one isn't already on the page
            const alreadyOnPage = blockRefs.some(
              (b) => b.type === 'database_table' && b.databaseId === existingDb.id
            )
            if (!alreadyOnPage) {
              try {
                await onAddBlock('database_table', { databaseId: existingDb.id })
              } catch { /* non-fatal */ }
            }
            log.push(`Using existing table: ${existingDb.name}`)
            continue
          }

          // Build config for select columns
          const columnsWithConfig = cols.map((c) => ({
            ...c,
            config:
              c.type === 'select' || c.type === 'multi_select'
                ? JSON.stringify({
                    options: (c.options ?? []).map((label, i) => ({
                      id: crypto.randomUUID(),
                      label,
                      color: SELECT_COLORS[i % SELECT_COLORS.length],
                    })),
                  })
                : '{}',
          }))

          // Create the database first — set lastCreatedDbId before adding the block
          // so that subsequent stat/chart actions can use it even if block add fails
          const dbId = await onCreateTableFromSchema(name, icon, columnsWithConfig)
          lastCreatedDbId = dbId

          // Add the table block separately so a block-add failure doesn't
          // prevent stat/chart actions from finding the database
          let tableBlockAdded = false
          try {
            await onAddBlock('database_table', { databaseId: dbId })
            tableBlockAdded = true
          } catch {
            // block failed but database exists — stat/chart can still use it
          }
          log.push(tableBlockAdded ? `Created table: ${name}` : `⚠ Table "${name}" created in DB but block failed to add — try refreshing`)
        } else if (action.type === 'add_text') {
          const type = (action.blockType as BlockType) || 'text'
          await onAddBlock(type, { text: action.text ?? '' })
          log.push(`Added ${type} block`)
        } else if (action.type === 'add_stat') {
          const dbId = resolveDbId(action.databaseId, lastCreatedDbId)
          if (!dbId) { log.push('⚠ Stat skipped: no database found'); continue }
          await onAddBlock('database_stat', {
            databaseId: dbId,
            statLabel: action.statLabel ?? 'Stat',
            statFormula: action.statFormula ?? 'count',
            statColumn: action.statColumn ?? '',
            statFilterValue: action.statFilterValue ?? 'Win',
          })
          log.push(`Added stat: ${action.statLabel}`)
        } else if (action.type === 'add_chart') {
          const dbId = resolveDbId(action.databaseId, lastCreatedDbId)
          if (!dbId) { log.push('⚠ Chart skipped: no database found'); continue }
          await onAddBlock('database_chart', {
            databaseId: dbId,
            chartType: action.chartType ?? 'bar',
            chartTitle: action.chartTitle ?? 'Chart',
            chartGroupBy: action.chartGroupBy ?? '',
            chartMetric: action.chartMetric ?? 'count',
          })
          log.push(`Added chart: ${action.chartTitle}`)
        } else if (action.type === 'compute_stat') {
          const dbId = resolveDbId(action.databaseId, lastCreatedDbId)
          if (!dbId) { log.push('⚠ compute_stat: no database found'); continue }
          const res = await fetch(`/api/databases/${dbId}`)
          if (!res.ok) { log.push('⚠ compute_stat: failed to load data'); continue }
          const data = await res.json() as {
            entries: Array<{ values: Array<{ value: string; property: { name: string; type: string; config: string } }> }>
          }
          const entries = data.entries ?? []
          const formula = action.statFormula ?? 'winrate'
          const col = (action.statColumn ?? '').toLowerCase()
          const winVal = (action.statFilterValue ?? 'Win').toLowerCase()

          const resolveEntryVal = (raw: string, prop: { type: string; config: string }): string => {
            if (!raw?.trim()) return ''
            if (prop.type === 'select' || prop.type === 'multi_select') {
              try {
                const cfg = JSON.parse(prop.config ?? '{}') as { options?: Array<{ id: string; label: string }> }
                return cfg.options?.find(o => o.id === raw)?.label ?? raw
              } catch { return raw }
            }
            return raw
          }

          let result = '—'
          if (formula === 'count') {
            result = String(entries.length)
          } else if (formula === 'winrate') {
            const vals = entries.map(e => {
              const v = e.values.find(v => v.property.name.toLowerCase() === col)
              if (!v) return ''
              return resolveEntryVal(v.value, v.property)
            })
            const filled = vals.filter(v => v.trim() !== '')
            if (filled.length > 0) {
              const wins = filled.filter(v => v.toLowerCase() === winVal).length
              result = `${Math.round((wins / filled.length) * 100)}% (${wins}/${filled.length})`
            }
          } else if (formula === 'sum' || formula === 'average') {
            const nums = entries
              .map(e => e.values.find(v => v.property.name.toLowerCase() === col)?.value ?? '')
              .map(Number).filter(n => !isNaN(n) && n !== 0)
            if (nums.length > 0) {
              const sum = nums.reduce((a, b) => a + b, 0)
              result = formula === 'sum' ? String(sum) : String(Math.round((sum / nums.length) * 100) / 100)
            }
          }
          messageOverrides['{{STAT}}'] = result
          log.push(`Computed ${formula}: ${result}`)
        } else if (action.type === 'remove_blocks') {
          const targetType = action.blockType ?? 'any'
          const scope = action.scope ?? 'all'
          const matching = blockRefs.filter((b) =>
            targetType === 'any' ? true : b.type === targetType
          )
          const toRemove = scope === 'first' ? matching.slice(0, 1) : matching
          if (toRemove.length === 0) {
            log.push('⚠ No matching blocks found to remove')
          } else {
            await onDeleteBlocks(toRemove.map((b) => b.id))
            log.push(`Removed ${toRemove.length} block${toRemove.length > 1 ? 's' : ''}`)
          }
        }
      } catch {
        log.push(`⚠ Action failed: ${action.type}`)
      }
    }

    return { log, messageOverrides }
  }

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setError(null)
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setLoading(true)

    // Refresh database stats before sending so AI has up-to-date data
    let freshDatabases = databases
    if (databaseIds.length > 0) {
      const refreshed = await Promise.all(
        databaseIds.map(async (id) => {
          try {
            const r = await fetch(`/api/databases/${id}`)
            if (!r.ok) return null
            const db = await r.json() as {
              id: string; name: string
              properties: Array<{ name: string; type: string; config: string }>
              entries: Array<{ values: Array<{ value: string; property: { name: string; type: string; config: string } }> }>
            }
            const entries = db.entries ?? []
            const statLines: string[] = [`total entries: ${entries.length}`]
            const resolveVal2 = (raw: string, propConfig: string, propType: string): string => {
              if (!raw?.trim()) return ''
              if (propType === 'select' || propType === 'multi_select') {
                try {
                  const cfg = JSON.parse(propConfig ?? '{}') as { options?: Array<{ id: string; label: string }> }
                  return cfg.options?.find(o => o.id === raw)?.label ?? raw
                } catch { return raw }
              }
              return raw
            }
            for (const prop of db.properties) {
              if (prop.type === 'select' || prop.type === 'multi_select') {
                const dist: Record<string, number> = {}
                for (const entry of entries) {
                  const v = entry.values.find(v => v.property.name === prop.name)
                  if (!v) continue
                  const label = resolveVal2(v.value, prop.config, prop.type)
                  if (label) dist[label] = (dist[label] ?? 0) + 1
                }
                if (Object.keys(dist).length > 0) {
                  statLines.push(`${prop.name} distribution: {${Object.entries(dist).map(([k,v]) => `${k}:${v}`).join(', ')}}`)
                  const totalFilled = Object.values(dist).reduce((a,b) => a+b, 0)
                  const wins = dist['Win'] ?? dist['win'] ?? dist['WIN'] ?? 0
                  if (wins > 0) statLines.push(`win rate (${prop.name}): ${Math.round((wins/totalFilled)*100)}% (${wins}/${totalFilled})`)
                }
              }
            }
            return { id: db.id, name: db.name, columns: db.properties.map(p => p.name), stats: statLines.join('; ') }
          } catch { return null }
        })
      )
      freshDatabases = refreshed.filter(Boolean) as typeof databases
    }

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          pageContext: {
            title: pageTitle,
            databases: freshDatabases,
          },
        }),
      })

      const payload = await res.json() as { message?: string; actions?: ChatAction[]; error?: string }

      if (!res.ok || payload.error) {
        setError(payload.error ?? 'Something went wrong')
        setLoading(false)
        return
      }

      const actions = (payload.actions ?? []) as ChatAction[]

      // Execute all actions and collect log + message overrides
      let log: string[] = []
      let messageOverrides: Record<string, string> = {}
      if (actions.length > 0) {
        ;({ log, messageOverrides } = await executeActions(actions))
      }

      // Apply any {{PLACEHOLDER}} replacements into the AI message
      let finalMessage = payload.message ?? ''
      for (const [placeholder, value] of Object.entries(messageOverrides)) {
        finalMessage = finalMessage.replaceAll(placeholder, value)
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: finalMessage }])
      if (log.length > 0) setActionsLog((prev) => [...prev.slice(-20), ...log])
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        ref={toggleRef}
        onClick={() => setOpen((v) => !v)}
        className={[
          'fixed bottom-6 right-6 z-50',
          'flex h-12 w-12 items-center justify-center rounded-full shadow-lg',
          'transition-all duration-200',
          open
            ? 'bg-zinc-700 text-white ring-2 ring-zinc-600'
            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white',
        ].join(' ')}
        aria-label={open ? 'Close assistant' : 'Open AI assistant'}
        title="AI Page Assistant"
      >
        {open ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="2" y1="2" x2="14" y2="14" />
            <line x1="14" y1="2" x2="2" y2="14" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="10" r="1" fill="currentColor" stroke="none" />
            <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div ref={panelRef} className="fixed bottom-0 right-0 z-50 flex flex-col w-80 sm:w-96 h-[520px] sm:h-[560px] m-4 sm:m-6 rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <p className="text-sm font-medium text-white">AI Assistant</p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => { setMessages([]); setActionsLog([]) }}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.length === 0 && !loading && (
              <div className="py-6 text-center">
                <p className="text-2xl mb-2">✨</p>
                <p className="text-sm font-medium text-zinc-300">Page Assistant</p>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  I can create tables, stats, charts and text blocks on this page.
                </p>
                <div className="mt-4 space-y-1.5 text-left">
                  {[
                    'Create a trading journal table',
                    'Add a live win rate stat',
                    'Add a chart showing wins vs losses',
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="w-full text-left px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:border-zinc-600 hover:text-white transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={[
                    'max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed',
                    m.role === 'user'
                      ? 'bg-zinc-700 text-white'
                      : 'bg-zinc-900 text-zinc-200 border border-zinc-800',
                  ].join(' ')}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {/* Actions log */}
            {actionsLog.length > 0 && (
              <div className="rounded-lg bg-zinc-900/80 border border-zinc-800 px-3 py-2 space-y-1">
                {actionsLog.slice(-5).map((log, i) => (
                  <p key={i} className="text-xs text-zinc-500">
                    {log.startsWith('⚠') ? log : `✓ ${log}`}
                  </p>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-xs text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-zinc-800 p-3 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={loading}
                placeholder="Ask me to create tables, charts, stats..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-500 disabled:opacity-50 min-h-[38px] max-h-24"
                style={{ fieldSizing: 'content' } as React.CSSProperties}
              />
              <button
                onClick={() => void send()}
                disabled={loading || !input.trim()}
                className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl bg-white text-black transition-opacity disabled:opacity-30"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="12" x2="7" y2="2" />
                  <polyline points="3,6 7,2 11,6" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-zinc-700 mt-1.5 text-center">Enter to send · Shift+Enter for newline</p>
          </div>
        </div>
      )}
    </>
  )
}
