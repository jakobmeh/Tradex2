'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import EmbeddedDatabaseBlock from './EmbeddedDatabaseBlock'
import SlashMenu from './SlashMenu'
import DatabaseStatBlock from '@/components/blocks/DatabaseStatBlock'
import DatabaseChartBlock from '@/components/blocks/DatabaseChartBlock'
import { Block, BlockContent, BlockType } from '@/lib/blocks'

type Props = {
  block: Block
  onUpdate: (id: string, content: BlockContent) => void
  onDelete: (id: string) => void
  onAddAfter: (id: string, type?: BlockType) => void
  onTypeChange: (id: string, type: BlockType) => void
  onCreateDatabaseTable: (id: string, name?: string) => Promise<void>
}

export default function BlockItem({
  block,
  onUpdate,
  onDelete,
  onAddAfter,
  onTypeChange,
  onCreateDatabaseTable,
}: Props) {
  const content: BlockContent = (() => {
    try {
      return JSON.parse(block.content ?? '{}')
    } catch {
      return {}
    }
  })()

  const [showSlash, setShowSlash] = useState(false)
  const [slashQuery, setSlashQuery] = useState('')
  const [showHandle, setShowHandle] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const editableRef = useRef<HTMLDivElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textRef = useRef(content.text ?? '')

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })

  const showBlockHandle = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
    setShowHandle(true)
  }, [])

  const hideBlockHandle = useCallback(() => {
    if (isDragging || isFocused) return
    hideTimer.current = setTimeout(() => setShowHandle(false), 80)
  }, [isDragging, isFocused])

  useEffect(() => {
    const nextText = content.text ?? ''

    // Only sync DOM if content changed externally (not from user typing)
    // This prevents clearing typed content during temp→real ID swap
    if (nextText !== textRef.current) {
      textRef.current = nextText
      if (editableRef.current) {
        editableRef.current.textContent = nextText
      }
    }
  }, [block.id, content.text])

  useEffect(() => (
    () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  ), [])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.25 : 1,
  }

  const controlsVisible = showHandle || isFocused

  const editorStyle = {
    direction: 'ltr' as const,
    unicodeBidi: 'plaintext' as const,
    textAlign: 'left' as const,
  }

  const save = useCallback((newText: string) => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
    }

    saveTimer.current = setTimeout(() => {
      onUpdate(block.id, { ...content, text: newText })
    }, 150)
  }, [block.id, content, onUpdate])

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const val = e.currentTarget.textContent ?? ''
    textRef.current = val
    save(val)

    const slashIdx = val.lastIndexOf('/')
    if (slashIdx !== -1) {
      setSlashQuery(val.slice(slashIdx + 1))
      setShowSlash(true)
      return
    }

    setShowSlash(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !showSlash) {
      e.preventDefault()
      onAddAfter(block.id)
    }

    if (e.key === 'Backspace' && textRef.current === '') {
      e.preventDefault()
      onDelete(block.id)
    }
  }

  const handleSlashSelect = async (type: BlockType) => {
    const currentText = textRef.current
    const slashIdx = currentText.lastIndexOf('/')
    const newText = currentText.slice(0, slashIdx)
    const suggestedName = newText.trim()
    textRef.current = newText

    if (editableRef.current) {
      editableRef.current.textContent = newText
    }

    setShowSlash(false)

    if (type === 'database_table') {
      await onCreateDatabaseTable(block.id, suggestedName || undefined)
      return
    }

    onTypeChange(block.id, type)
    if (type !== 'divider') {
      onUpdate(block.id, { ...content, text: newText })
    }
  }

  const getPlaceholder = () => {
    if (block.type === 'heading1') return 'Heading 1'
    if (block.type === 'heading2') return 'Heading 2'
    if (block.type === 'heading3') return 'Heading 3'
    if (block.type === 'quote') return 'Quote...'
    if (block.type === 'code') return 'Code...'
    if (block.type === 'callout') return 'Callout...'
    return "Type '/' for commands..."
  }

  const getClassName = () => {
    const base =
      'min-h-[1.5rem] w-full break-words outline-none empty:before:text-zinc-600 empty:before:content-[attr(data-placeholder)]'

    if (block.type === 'heading1') return `${base} text-3xl font-bold text-white`
    if (block.type === 'heading2') return `${base} text-2xl font-semibold text-white`
    if (block.type === 'heading3') return `${base} text-xl font-medium text-white`
    if (block.type === 'quote') return `${base} border-l-2 border-zinc-500 pl-4 italic text-zinc-300`
    if (block.type === 'code') return `${base} rounded bg-zinc-800 p-3 font-mono text-sm text-green-400`
    if (block.type === 'callout') return `${base} text-zinc-200`
    return `${base} text-zinc-300`
  }

  // Both controls in one panel: [✕ remove] [⠿ drag]
  const blockControls = (
    <div
      className={`absolute -left-[3.75rem] top-0.5 flex items-center gap-0.5 transition-opacity duration-100 ${
        controlsVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      onMouseEnter={showBlockHandle}
      onMouseLeave={hideBlockHandle}
    >
      {/* Remove button */}
      <button
        type="button"
        aria-label="Remove block"
        onPointerDown={e => e.stopPropagation()}
        onClick={() => onDelete(block.id)}
        className="flex h-6 w-6 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400"
      >
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="1" y1="1" x2="8" y2="8" />
          <line x1="8" y1="1" x2="1" y2="8" />
        </svg>
      </button>

      {/* Drag handle — listeners go HERE, not on the container */}
      <button
        type="button"
        aria-label="Drag block"
        {...attributes}
        {...listeners}
        className={`flex h-6 w-6 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 select-none touch-none ${
          isDragging ? 'cursor-grabbing text-zinc-300' : 'cursor-grab'
        }`}
      >
        <svg width="10" height="15" viewBox="0 0 10 15" fill="currentColor">
          <circle cx="2.5" cy="2.5" r="1.5" />
          <circle cx="7.5" cy="2.5" r="1.5" />
          <circle cx="2.5" cy="7.5" r="1.5" />
          <circle cx="7.5" cy="7.5" r="1.5" />
          <circle cx="2.5" cy="12.5" r="1.5" />
          <circle cx="7.5" cy="12.5" r="1.5" />
        </svg>
      </button>
    </div>
  )

  const sharedHandlers = {
    onMouseEnter: showBlockHandle,
    onMouseLeave: hideBlockHandle,
  }

  if (block.type === 'divider') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="relative group py-2"
        {...sharedHandlers}
      >
        {blockControls}
        <hr className="border-zinc-700" />
      </div>
    )
  }

  if (block.type === 'todo') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="relative group flex items-start gap-2 py-0.5"
        {...sharedHandlers}
      >
        {blockControls}
        <input
          type="checkbox"
          checked={content.checked ?? false}
          onChange={e => onUpdate(block.id, { ...content, checked: e.target.checked })}
          onPointerDown={e => e.stopPropagation()}
          className="mt-1 shrink-0 accent-blue-500"
        />
        <div
          ref={editableRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder="To-do..."
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true)
            showBlockHandle()
          }}
          onBlur={() => {
            setIsFocused(false)
            hideBlockHandle()
          }}
          dir="ltr"
          style={editorStyle}
          className={`min-h-[1.5rem] flex-1 break-words text-zinc-300 outline-none empty:before:text-zinc-600 empty:before:content-[attr(data-placeholder)] ${
            content.checked ? 'line-through text-zinc-500' : ''
          }`}
        />
      </div>
    )
  }

  if (block.type === 'callout') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="relative group flex items-start gap-3 rounded-lg bg-zinc-800 p-3 py-0.5"
        {...sharedHandlers}
      >
        {blockControls}
        <span className="mt-0.5 text-xl">!</span>
        <div
          ref={editableRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={getPlaceholder()}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true)
            showBlockHandle()
          }}
          onBlur={() => {
            setIsFocused(false)
            hideBlockHandle()
          }}
          dir="ltr"
          style={editorStyle}
          className={getClassName()}
        />
      </div>
    )
  }

  if (block.type === 'database_table') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="relative group overflow-x-visible py-3"
        {...sharedHandlers}
      >
        {blockControls}
        <EmbeddedDatabaseBlock databaseId={content.databaseId} />
      </div>
    )
  }

  if (block.type === 'database_stat') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="relative group py-2"
        {...sharedHandlers}
      >
        {blockControls}
        <DatabaseStatBlock
          databaseId={content.databaseId ?? ''}
          statLabel={content.statLabel ?? 'Stat'}
          statFormula={content.statFormula ?? 'count'}
          statColumn={content.statColumn ?? ''}
          statFilterValue={content.statFilterValue}
        />
      </div>
    )
  }

  if (block.type === 'database_chart') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="relative group py-2"
        {...sharedHandlers}
      >
        {blockControls}
        <DatabaseChartBlock
          databaseId={content.databaseId ?? ''}
          chartType={content.chartType ?? 'bar'}
          chartTitle={content.chartTitle ?? 'Chart'}
          chartGroupBy={content.chartGroupBy ?? ''}
          chartMetric={content.chartMetric ?? 'count'}
        />
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group py-0.5"
      {...sharedHandlers}
    >
      {blockControls}

      {block.type === 'bullet_list' ? <span className="absolute left-0 top-1 text-zinc-400">*</span> : null}
      {block.type === 'numbered_list' ? (
        <span className="absolute left-0 top-0.5 text-sm text-zinc-400">{block.order + 1}.</span>
      ) : null}

      <div
        ref={editableRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={getPlaceholder()}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          setIsFocused(true)
          showBlockHandle()
        }}
        onBlur={() => {
          setIsFocused(false)
          hideBlockHandle()
        }}
        dir="ltr"
        style={editorStyle}
        className={`${getClassName()} ${['bullet_list', 'numbered_list'].includes(block.type) ? 'pl-5' : ''}`}
      />

      {showSlash ? (
        <div className="relative">
          <SlashMenu
            key={slashQuery}
            query={slashQuery}
            onSelect={handleSlashSelect}
            onClose={() => setShowSlash(false)}
          />
        </div>
      ) : null}
    </div>
  )
}
