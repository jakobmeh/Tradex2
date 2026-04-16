'use client'
import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { usePageTitles } from '@/lib/page-title-context'
import type { EmojiClickData } from 'emoji-picker-react'
import { Theme } from 'emoji-picker-react'

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false })

type Page = { id: string; title: string; icon: string | null }

export default function PageHeader({ page }: { page: Page }) {
  const editableRef = useRef<HTMLDivElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const { setTitle } = usePageTitles()
  const [pickerOpen, setPickerOpen] = useState(false)
  // Only treat single-character emoji as valid icons
  const isEmoji = (val: string | null) => !!val && [...val].length <= 2
  const [icon, setIcon] = useState(isEmoji(page.icon) ? page.icon : null)

  useEffect(() => {
    if (editableRef.current && editableRef.current.textContent !== page.title) {
      editableRef.current.textContent = page.title
    }
  }, [page.id, page.title])

  useEffect(() => {
    if (!pickerOpen) return
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pickerOpen])

  const saveTitle = (val: string) => {
    setTitle(page.id, val)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      fetch(`/api/pages/${page.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: val }),
      })
    }, 500)
  }

  const onEmojiClick = (data: EmojiClickData) => {
    setIcon(data.emoji)
    setPickerOpen(false)
    fetch(`/api/pages/${page.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ icon: data.emoji }),
    })
  }

  return (
    <div className="mb-8 group">
      <div className="relative mb-3 inline-block" ref={pickerRef}>
        <button
          onClick={() => setPickerOpen((p) => !p)}
          className="text-5xl transition-opacity hover:opacity-70"
          title="Change icon"
        >
          {icon ?? '📄'}
        </button>

        {pickerOpen && (
          <div className="absolute left-0 top-full z-50 mt-2">
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              theme={Theme.DARK}
              skinTonesDisabled
              searchPlaceholder="Search emoji..."
              width={320}
              height={380}
            />
          </div>
        )}
      </div>

      <div
        ref={editableRef}
        contentEditable
        suppressContentEditableWarning
        onInput={e => saveTitle(e.currentTarget.textContent ?? '')}
        onKeyDown={e => {
          if (e.key === 'Enter') e.preventDefault()
        }}
        data-placeholder="Untitled"
        dir="ltr"
        style={{ direction: 'ltr', unicodeBidi: 'plaintext', textAlign: 'left' }}
        className="break-words text-4xl font-bold text-white outline-none empty:before:text-zinc-700 empty:before:content-[attr(data-placeholder)]"
      >
        {page.title}
      </div>
    </div>
  )
}
