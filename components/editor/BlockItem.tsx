'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import SlashMenu from './SlashMenu'
import EmbeddedDatabaseBlock from './EmbeddedDatabaseBlock'
import { Block, BlockContent, BlockType } from '@/lib/blocks'

type Props = {
  block: Block
  onUpdate: (id: string, content: BlockContent) => void
  onDelete: (id: string) => void
  onAddAfter: (id: string, type?: BlockType) => void
  onTypeChange: (id: string, type: BlockType) => void
  onCreateDatabaseTable: (id: string, name?: string) => Promise<void>
  onOpenAITablePrompt: (id: string, prompt?: string) => void
}

export default function BlockItem({
  block,
  onUpdate,
  onDelete,
  onAddAfter,
  onTypeChange,
  onCreateDatabaseTable,
  onOpenAITablePrompt,
}: Props) {
  const content: BlockContent = (() => { try { return JSON.parse(block.content ?? '{}') } catch { return {} } })()
  const [showSlash, setShowSlash] = useState(false)
  const [slashQuery, setSlashQuery] = useState('')
  const [showHandle, setShowHandle] = useState(false)
  const editableRef = useRef<HTMLDivElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textRef = useRef(content.text ?? '')

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const editorStyle = {
    direction: 'ltr' as const,
    unicodeBidi: 'plaintext' as const,
    textAlign: 'left' as const,
  }

  useEffect(() => {
    const nextText = content.text ?? ''
    textRef.current = nextText

    if (editableRef.current && editableRef.current.textContent !== nextText) {
      editableRef.current.textContent = nextText
    }
  }, [block.id, content.text])

  const save = useCallback((newText: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      onUpdate(block.id, { ...content, text: newText })
    }, 500)
  }, [block.id, content, onUpdate])

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const val = e.currentTarget.textContent ?? ''
    textRef.current = val
    save(val)

    const slashIdx = val.lastIndexOf('/')
    if (slashIdx !== -1) {
      setSlashQuery(val.slice(slashIdx + 1))
      setShowSlash(true)
    } else {
      setShowSlash(false)
    }
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
    if (editableRef.current) editableRef.current.textContent = newText
    setShowSlash(false)

    if (type === 'database_table') {
      await onCreateDatabaseTable(block.id, suggestedName || undefined)
      return
    }

    if (type === 'ai_table') {
      onOpenAITablePrompt(block.id, suggestedName || undefined)
      return
    }

    onTypeChange(block.id, type)
    if (type !== 'divider') onUpdate(block.id, { ...content, text: newText })
  }

  const getPlaceholder = () => {
    if (block.type === 'heading1') return 'Heading 1'
    if (block.type === 'heading2') return 'Heading 2'
    if (block.type === 'heading3') return 'Heading 3'
    if (block.type === 'quote')    return 'Quote...'
    if (block.type === 'code')     return 'Code...'
    if (block.type === 'callout')  return 'Callout...'
    return "Type '/' for commands..."
  }

  const getClassName = () => {
    const base = 'outline-none w-full break-words min-h-[1.5rem] empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-600'
    if (block.type === 'heading1') return `${base} text-3xl font-bold text-white`
    if (block.type === 'heading2') return `${base} text-2xl font-semibold text-white`
    if (block.type === 'heading3') return `${base} text-xl font-medium text-white`
    if (block.type === 'quote')    return `${base} text-zinc-300 italic border-l-2 border-zinc-500 pl-4`
    if (block.type === 'code')     return `${base} font-mono text-green-400 bg-zinc-800 rounded p-3 text-sm`
    if (block.type === 'callout')  return `${base} text-zinc-200`
    return `${base} text-zinc-300`
  }

  if (block.type === 'divider') {
    return (
      <div ref={setNodeRef} style={style} className="relative group py-2"
        onMouseEnter={() => setShowHandle(true)} onMouseLeave={() => setShowHandle(false)}>
        {showHandle && (
          <button {...attributes} {...listeners}
            className="absolute -left-6 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 cursor-grab text-xs">
            ⠿
          </button>
        )}
        <hr className="border-zinc-700" />
      </div>
    )
  }

  if (block.type === 'todo') {
    return (
      <div ref={setNodeRef} style={style}
        className="relative group flex items-start gap-2 py-0.5"
        onMouseEnter={() => setShowHandle(true)} onMouseLeave={() => setShowHandle(false)}>
        {showHandle && (
          <button {...attributes} {...listeners}
            className="absolute -left-6 top-1 text-zinc-600 hover:text-zinc-400 cursor-grab text-xs">
            ⠿
          </button>
        )}
        <input type="checkbox" checked={content.checked ?? false}
          onChange={e => onUpdate(block.id, { ...content, checked: e.target.checked })}
          className="mt-1 accent-blue-500 shrink-0" />
        <div ref={editableRef} contentEditable suppressContentEditableWarning
          data-placeholder="To-do..."
          onInput={handleInput} onKeyDown={handleKeyDown}
          dir="ltr"
          style={editorStyle}
          className={`outline-none flex-1 text-zinc-300 break-words min-h-[1.5rem]
            empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-600
            ${content.checked ? 'line-through text-zinc-500' : ''}`} />
      </div>
    )
  }

  if (block.type === 'callout') {
    return (
      <div ref={setNodeRef} style={style}
        className="relative group flex items-start gap-3 bg-zinc-800 rounded-lg p-3 py-0.5"
        onMouseEnter={() => setShowHandle(true)} onMouseLeave={() => setShowHandle(false)}>
        {showHandle && (
          <button {...attributes} {...listeners}
            className="absolute -left-6 top-3 text-zinc-600 hover:text-zinc-400 cursor-grab text-xs">
            ⠿
          </button>
        )}
        <span className="text-xl mt-0.5">💡</span>
        <div ref={editableRef} contentEditable suppressContentEditableWarning
          data-placeholder={getPlaceholder()}
          onInput={handleInput} onKeyDown={handleKeyDown}
          dir="ltr"
          style={editorStyle}
          className={getClassName()} />
      </div>
    )
  }

  if (block.type === 'database_table') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="relative group py-3"
        onMouseEnter={() => setShowHandle(true)}
        onMouseLeave={() => setShowHandle(false)}
      >
        {showHandle && (
          <button
            {...attributes}
            {...listeners}
            className="absolute -left-6 top-4 text-zinc-600 hover:text-zinc-400 cursor-grab text-xs select-none"
          >
            â ¿
          </button>
        )}
        <EmbeddedDatabaseBlock databaseId={content.databaseId} />
      </div>
    )
  }

  return (
    <div ref={setNodeRef} style={style}
      className="relative group py-0.5"
      onMouseEnter={() => setShowHandle(true)} onMouseLeave={() => setShowHandle(false)}>

      {/* drag handle */}
      {showHandle && (
        <button {...attributes} {...listeners}
          className="absolute -left-6 top-1 text-zinc-600 hover:text-zinc-400 cursor-grab text-xs select-none">
          ⠿
        </button>
      )}

      {/* bullet */}
      {block.type === 'bullet_list' && (
        <span className="absolute left-0 top-1 text-zinc-400">•</span>
      )}
      {block.type === 'numbered_list' && (
        <span className="absolute left-0 top-0.5 text-zinc-400 text-sm">{block.order + 1}.</span>
      )}

      <div
        ref={editableRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={getPlaceholder()}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        dir="ltr"
        style={editorStyle}
        className={`${getClassName()} ${['bullet_list', 'numbered_list'].includes(block.type) ? 'pl-5' : ''}`}
      />

      {/* slash menu */}
      {showSlash && (
        <div className="relative">
          <SlashMenu
            key={slashQuery}
            query={slashQuery}
            onSelect={handleSlashSelect}
            onClose={() => setShowSlash(false)}
          />
        </div>
      )}
    </div>
  )
}
