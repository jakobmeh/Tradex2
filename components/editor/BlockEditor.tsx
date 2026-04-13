'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import BlockItem from './BlockItem'
import PageChatbot from '@/components/ai/PageChatbot'
import { Block, BlockContent, BlockType } from '@/lib/blocks'

type Props = {
  pageId: string
  pageTitle?: string
  initialBlocks?: Block[]
}

type ChatBlockRef = {
  id: string
  type: BlockType
  databaseId?: string
}

// Stable key for React reconciliation — survives temp→real ID swap
type BlockEntry = Block & { _key: string }

function normalizeOrders<T extends { order: number }>(items: T[]): T[] {
  return items.map((item, index) => ({ ...item, order: index }))
}

function toEntry(block: Block): BlockEntry {
  return { ...block, _key: block.id }
}

function getBlockText(block: Block): string {
  try {
    const c = JSON.parse(block.content ?? '{}') as { text?: string }
    return c.text ?? ''
  } catch {
    return ''
  }
}

const SELECT_COLORS = ['gray', 'red', 'orange', 'yellow', 'green', 'blue', 'purple']

function DragGhost({ block }: { block: Block }) {
  const text = getBlockText(block)

  if (block.type === 'divider') return <hr className="border-zinc-600 w-full" />
  if (block.type === 'heading1') return <span className="text-2xl font-bold text-white">{text || 'Heading 1'}</span>
  if (block.type === 'heading2') return <span className="text-xl font-semibold text-white">{text || 'Heading 2'}</span>
  if (block.type === 'heading3') return <span className="text-lg font-medium text-white">{text || 'Heading 3'}</span>
  if (block.type === 'code') return <span className="font-mono text-sm text-green-400">{text || '...'}</span>
  if (block.type === 'database_table') return <span className="text-zinc-400 text-sm italic">Database Table</span>
  if (block.type === 'database_stat') return <span className="text-zinc-400 text-sm italic">Live Stat</span>
  if (block.type === 'database_chart') return <span className="text-zinc-400 text-sm italic">Chart</span>
  if (block.type === 'callout') return <span className="text-zinc-200 text-sm">! {text || '...'}</span>
  return <span className="text-zinc-300 text-sm">{text || '...'}</span>
}

export default function BlockEditor({ pageId, pageTitle = 'Untitled', initialBlocks = [] }: Props) {
  const [blocks, setBlocks] = useState<BlockEntry[]>(() => initialBlocks.map(toEntry))
  const [loading, setLoading] = useState(initialBlocks.length === 0)
  const [activeId, setActiveId] = useState<string | null>(null)
  const blocksRef = useRef<BlockEntry[]>([])

  useEffect(() => {
    blocksRef.current = blocks
  }, [blocks])

  const focusEditableBlock = useCallback((blockId: string) => {
    setTimeout(() => {
      const el = document.querySelector(`[data-block-id="${blockId}"] [contenteditable]`) as HTMLElement | null
      el?.focus()
    }, 30)
  }, [])

  const persistOrder = useCallback(async (reordered: BlockEntry[]) => {
    const serverBlocks = reordered.filter(b => !b.id.startsWith('temp_'))
    if (serverBlocks.length === 0) return

    const res = await fetch('/api/blocks/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks: serverBlocks.map(b => ({ id: b.id, order: b.order })) }),
    })

    if (!res.ok) throw new Error('Failed to save block order')
  }, [])

  const addBlock = useCallback(async (
    type: BlockType = 'text',
    afterId: string | null = null,
    skipState = false,
    initialContent?: BlockContent
  ) => {
    const currentBlocks = blocksRef.current
    const afterIndex = afterId
      ? currentBlocks.findIndex(block => block.id === afterId)
      : currentBlocks.length - 1
    const order = afterIndex + 1

    const contentStr = initialContent ? JSON.stringify(initialContent) : JSON.stringify({ text: '' })

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const tempEntry: BlockEntry = {
      id: tempId,
      _key: tempId,
      type,
      content: contentStr,
      order,
      pageId,
      parentId: null,
    }

    if (skipState) {
      setBlocks([tempEntry])
      blocksRef.current = [tempEntry]
    } else {
      const previous = blocksRef.current
      const optimistic = normalizeOrders([
        ...previous.slice(0, order),
        tempEntry,
        ...previous.slice(order),
      ])
      setBlocks(optimistic)
      blocksRef.current = optimistic
      // Only focus text-editable blocks
      if (!['database_table', 'database_stat', 'database_chart', 'divider'].includes(type)) {
        focusEditableBlock(tempId)
      }
    }

    let newBlock: Block
    try {
      const res = await fetch(`/api/pages/${pageId}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content: contentStr, order }),
      })

      if (!res.ok) throw new Error('Failed to create block')
      newBlock = await res.json()
    } catch (error) {
      if (skipState) {
        setBlocks([])
        blocksRef.current = []
      } else {
        const rolledBack = normalizeOrders(blocksRef.current.filter(b => b.id !== tempId))
        setBlocks(rolledBack)
        blocksRef.current = rolledBack
      }
      throw error
    }

    const current = blocksRef.current
    const tempEntry2 = current.find(b => b.id === tempId)
    const preservedContent = tempEntry2?.content ?? newBlock.content

    const withReal = normalizeOrders(
      current.map(b =>
        b.id === tempId
          ? { ...newBlock, _key: b._key, content: preservedContent ?? b.content }
          : b
      )
    )
    setBlocks(withReal)
    blocksRef.current = withReal

    if (preservedContent && preservedContent !== JSON.stringify({ text: '' })) {
      void fetch(`/api/blocks/${newBlock.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: preservedContent }),
      })
    }

    if (skipState) return

    void persistOrder(withReal)

    if (!['database_table', 'database_stat', 'database_chart', 'divider'].includes(type)) {
      focusEditableBlock(newBlock.id)
    }
  }, [focusEditableBlock, pageId, persistOrder])

  useEffect(() => {
    if (initialBlocks.length > 0) {
      setBlocks(initialBlocks.map(toEntry))
      setLoading(false)
      return
    }

    let cancelled = false

    async function bootstrapEmptyPage() {
      try {
        await addBlock('text', null, true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void bootstrapEmptyPage()
    return () => { cancelled = true }
  }, [addBlock, initialBlocks])

  const updateBlock = useCallback(async (id: string, content: BlockContent) => {
    setBlocks(prev => prev.map(block => (
      block.id === id ? { ...block, content: JSON.stringify(content) } : block
    )))

    if (id.startsWith('temp_')) return

    await fetch(`/api/blocks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: JSON.stringify(content) }),
    })
  }, [])

  const deleteBlock = useCallback(async (id: string) => {
    const previous = blocksRef.current
    const removedIndex = previous.findIndex(block => block.id === id)
    const next = normalizeOrders(previous.filter(block => block.id !== id))
    const focusTarget = next[Math.max(0, removedIndex - 1)]?.id ?? null

    setBlocks(next)
    blocksRef.current = next

    try {
      if (!id.startsWith('temp_')) {
        const res = await fetch(`/api/blocks/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to delete block')
      }

      if (next.length === 0) {
        await addBlock('text', null, true)
        return
      }

      void persistOrder(next)

      if (focusTarget) focusEditableBlock(focusTarget)
    } catch {
      setBlocks(previous)
      blocksRef.current = previous
    }
  }, [addBlock, focusEditableBlock, persistOrder])

  const deleteBlocksByIds = useCallback(async (ids: string[]) => {
    const uniqueIds = Array.from(new Set(ids)).filter(Boolean)
    if (uniqueIds.length === 0) return

    const previous = blocksRef.current
    const idSet = new Set(uniqueIds)
    const next = normalizeOrders(previous.filter((block) => !idSet.has(block.id)))

    setBlocks(next)
    blocksRef.current = next

    try {
      const deletions = uniqueIds
        .filter((id) => !id.startsWith('temp_'))
        .map(async (id) => {
          const res = await fetch(`/api/blocks/${id}`, { method: 'DELETE' })
          if (!res.ok) throw new Error('Failed to delete block')
        })
      await Promise.all(deletions)

      if (next.length === 0) {
        await addBlock('text', null, true)
        return
      }

      void persistOrder(next)
    } catch {
      setBlocks(previous)
      blocksRef.current = previous
    }
  }, [addBlock, persistOrder])

  const changeType = useCallback(async (id: string, type: BlockType) => {
    setBlocks(prev => prev.map(block => (block.id === id ? { ...block, type } : block)))

    if (id.startsWith('temp_')) return

    await fetch(`/api/blocks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    })
  }, [])

  const createDatabaseTableBlock = useCallback(async (id: string, name?: string) => {
    const createRes = await fetch('/api/databases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name?.trim() || 'Untitled Database' }),
    })

    if (!createRes.ok) throw new Error('Failed to create database')

    const database = await createRes.json() as { id: string }
    const content = { databaseId: database.id }

    setBlocks(prev => prev.map(block => (
      block.id === id ? { ...block, type: 'database_table', content: JSON.stringify(content) } : block
    )))

    await fetch(`/api/blocks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'database_table', content: JSON.stringify(content) }),
    })

    await addBlock('text', id)
  }, [addBlock])

  // Used by chatbot to create a database with full schema, returns the new database ID
  const createDatabaseFromSchema = useCallback(async (
    name: string,
    icon: string,
    columns: Array<{ name: string; type: string; options?: string[]; config?: string }>
  ): Promise<string> => {
    const createRes = await fetch('/api/databases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, icon }),
    })

    if (!createRes.ok) throw new Error('Failed to create database')
    const database = await createRes.json() as { id: string }

    // Add columns (skip the title column if named "Name" since the DB likely has one)
    const nonTitle = columns.filter((c) => c.type !== 'title')
    for (const col of nonTitle) {
      await fetch(`/api/databases/${database.id}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: col.name,
          type: col.type,
          config: col.config ?? '{}',
        }),
      })
    }

    return database.id
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveId(null)

    const { active, over } = event
    if (!over || active.id === over.id) return

    const previous = blocksRef.current
    const oldIndex = previous.findIndex(block => block.id === active.id)
    const newIndex = previous.findIndex(block => block.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const reordered = normalizeOrders(arrayMove(previous, oldIndex, newIndex))
    setBlocks(reordered)
    blocksRef.current = reordered

    try {
      await persistOrder(reordered)
    } catch {
      setBlocks(previous)
      blocksRef.current = previous
    }
  }, [persistOrder])

  // Build database context for chatbot (databases embedded on this page)
  const chatDatabases = blocks
    .filter((b) => b.type === 'database_table')
    .map((b) => {
      try {
        const c = JSON.parse(b.content ?? '{}') as { databaseId?: string }
        return c.databaseId ?? null
      } catch {
        return null
      }
    })
    .filter(Boolean) as string[]

  const chatBlocks: ChatBlockRef[] = blocks.map((b) => {
    let databaseId: string | undefined
    if (b.type === 'database_table' || b.type === 'database_stat' || b.type === 'database_chart') {
      try {
        const c = JSON.parse(b.content ?? '{}') as { databaseId?: string }
        databaseId = c.databaseId
      } catch {
        databaseId = undefined
      }
    }
    return {
      id: b.id,
      type: b.type,
      databaseId,
    }
  })

  const activeBlock = activeId ? blocks.find(b => b.id === activeId) : null

  if (loading) {
    return (
      <div className="pl-8">
        <p className="text-xs text-zinc-600 mb-4 animate-pulse">Loading blocks...</p>
        <div className="space-y-3 animate-pulse">
          {[82, 65, 90, 52, 76, 44, 88].map((w, i) => (
            <div key={i} className="h-5 bg-zinc-800/70 rounded" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={blocks.map(block => block.id)} strategy={verticalListSortingStrategy}>
          <div className="pl-8">
            {blocks.map(block => (
              <div key={block._key} data-block-id={block.id}>
                <BlockItem
                  block={block}
                  onUpdate={updateBlock}
                  onDelete={deleteBlock}
                  onAddAfter={id => addBlock('text', id)}
                  onTypeChange={changeType}
                  onCreateDatabaseTable={createDatabaseTableBlock}
                />
              </div>
            ))}

            <div className="pt-4">
              <button
                type="button"
                onClick={() => void addBlock('text')}
                className="w-full rounded-lg border border-dashed border-zinc-800 px-3 py-2 text-left text-sm text-zinc-500 transition-colors hover:border-zinc-700 hover:bg-zinc-900/60 hover:text-white"
              >
                + Add block
              </button>
            </div>
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={{ duration: 120, easing: 'ease' }}>
          {activeBlock ? (
            <div className="rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-1.5 shadow-2xl ring-1 ring-zinc-500/30 cursor-grabbing select-none pl-8 opacity-95">
              <DragGhost block={activeBlock} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <PageChatbot
        pageId={pageId}
        pageTitle={pageTitle}
        databaseIds={chatDatabases}
        blockRefs={chatBlocks}
        onAddBlock={async (type, content) => {
          await addBlock(type, null, false, content)
        }}
        onCreateTableFromSchema={createDatabaseFromSchema}
        onDeleteBlocks={deleteBlocksByIds}
      />
    </>
  )
}
