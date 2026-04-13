'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor,
  PointerSensor, useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, arrayMove
} from '@dnd-kit/sortable'
import AITablePrompt from './AITablePrompt'
import BlockItem from './BlockItem'
import { Block, BlockContent, BlockType } from '@/lib/blocks'

type Props = { pageId: string }
type AITableModalState = { blockId: string; initialPrompt: string } | null

export default function BlockEditor({ pageId }: Props) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [aiTableModal, setAiTableModal] = useState<AITableModalState>(null)
  const [aiTableLoading, setAiTableLoading] = useState(false)
  const [aiTableError, setAiTableError] = useState<string | null>(null)
  const blocksRef = useRef<Block[]>([])

  useEffect(() => {
    blocksRef.current = blocks
  }, [blocks])

  const addBlock = useCallback(async (
    type: BlockType = 'text',
    afterId: string | null = null,
    skipState = false
  ) => {
    const currentBlocks = blocksRef.current
    const afterIndex = afterId
      ? currentBlocks.findIndex(b => b.id === afterId)
      : currentBlocks.length - 1
    const order = afterIndex + 1

    const res = await fetch(`/api/pages/${pageId}/blocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, content: JSON.stringify({ text: '' }), order }),
    })
    const newBlock: Block = await res.json()

    if (!skipState) {
      setBlocks(prev => {
        const next = [...prev]
        next.splice(order, 0, newBlock)
        return next.map((b, i) => ({ ...b, order: i }))
      })
      setTimeout(() => {
        const el = document.querySelector(`[data-block-id="${newBlock.id}"] [contenteditable]`) as HTMLElement
        el?.focus()
      }, 50)
    } else {
      setBlocks([newBlock])
    }
  }, [pageId])

  useEffect(() => {
    let cancelled = false

    async function loadBlocks() {
      setLoading(true)

      const res = await fetch(`/api/pages/${pageId}/blocks`)
      const data: Block[] = await res.json()

      if (cancelled) return

      if (Array.isArray(data) && data.length > 0) {
        setBlocks(data)
      } else {
        await addBlock('text', null, true)
      }

      if (!cancelled) {
        setLoading(false)
      }
    }

    void loadBlocks()

    return () => {
      cancelled = true
    }
  }, [addBlock, pageId])

  const updateBlock = useCallback(async (id: string, content: BlockContent) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content: JSON.stringify(content) } : b))
    await fetch(`/api/blocks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: JSON.stringify(content) }),
    })
  }, [])

  const deleteBlock = useCallback(async (id: string) => {
    const wasLastBlock = blocksRef.current.length <= 1

    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id)
      const next = prev.filter(b => b.id !== id)
      setTimeout(() => {
        const prevBlock = next[Math.max(0, idx - 1)]
        if (prevBlock) {
          const el = document.querySelector(`[data-block-id="${prevBlock.id}"] [contenteditable]`) as HTMLElement
          el?.focus()
        }
      }, 50)
      return next
    })
    await fetch(`/api/blocks/${id}`, { method: 'DELETE' })
    if (wasLastBlock) await addBlock('text', null, true)
  }, [addBlock])

  const changeType = useCallback(async (id: string, type: BlockType) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, type } : b))
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

    if (!createRes.ok) {
      throw new Error('Failed to create database')
    }

    const database = await createRes.json() as { id: string }
    const content = { databaseId: database.id }

    setBlocks(prev => prev.map(b =>
      b.id === id ? { ...b, type: 'database_table', content: JSON.stringify(content) } : b
    ))

    await fetch(`/api/blocks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'database_table', content: JSON.stringify(content) }),
    })

    await addBlock('text', id)
  }, [addBlock])

  const openAITablePrompt = useCallback((blockId: string, prompt?: string) => {
    setAiTableError(null)
    setAiTableModal({ blockId, initialPrompt: prompt ?? '' })
  }, [])

  const submitAITablePrompt = useCallback(async (prompt: string) => {
    if (!aiTableModal) return

    setAiTableLoading(true)
    setAiTableError(null)

    try {
      const res = await fetch('/api/ai/table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      const payload = await res.json().catch(() => null) as { error?: string; databaseId?: string } | null

      if (!res.ok || !payload?.databaseId) {
        throw new Error(payload?.error ?? 'Failed to generate AI table')
      }

      const content = { databaseId: payload.databaseId }
      const blockId = aiTableModal.blockId

      setBlocks(prev => prev.map(b =>
        b.id === blockId ? { ...b, type: 'database_table', content: JSON.stringify(content) } : b
      ))

      await fetch(`/api/blocks/${blockId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'database_table', content: JSON.stringify(content) }),
      })

      await addBlock('text', blockId)
      setAiTableModal(null)
    } catch (error) {
      setAiTableError(error instanceof Error ? error.message : 'Failed to generate AI table')
    } finally {
      setAiTableLoading(false)
    }
  }, [addBlock, aiTableModal])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setBlocks(prev => {
      const oldIndex = prev.findIndex(b => b.id === active.id)
      const newIndex = prev.findIndex(b => b.id === over.id)
      const reordered = arrayMove(prev, oldIndex, newIndex).map((b, i) => ({ ...b, order: i }))

      fetch('/api/blocks/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks: reordered.map(b => ({ id: b.id, order: b.order })) }),
      })

      return reordered
    })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
    </div>
  )

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
        <div className="pl-8">
          {blocks.map(block => (
            <div key={block.id} data-block-id={block.id}>
              <BlockItem
                block={block}
                onUpdate={updateBlock}
                onDelete={deleteBlock}
                onAddAfter={(id) => addBlock('text', id)}
                onTypeChange={changeType}
                onCreateDatabaseTable={createDatabaseTableBlock}
                onOpenAITablePrompt={openAITablePrompt}
              />
            </div>
          ))}
        </div>
      </SortableContext>

      {aiTableModal ? (
        <AITablePrompt
          initialPrompt={aiTableModal.initialPrompt}
          loading={aiTableLoading}
          error={aiTableError}
          onClose={() => {
            if (aiTableLoading) return
            setAiTableModal(null)
            setAiTableError(null)
          }}
          onSubmit={submitAITablePrompt}
        />
      ) : null}
    </DndContext>
  )
}
