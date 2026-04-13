'use client'
import { useEffect, useRef } from 'react'

type Page = { id: string; title: string; icon: string | null }

export default function PageHeader({ page }: { page: Page }) {
  const editableRef = useRef<HTMLDivElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (editableRef.current && editableRef.current.textContent !== page.title) {
      editableRef.current.textContent = page.title
    }
  }, [page.id, page.title])

  const saveTitle = (val: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      fetch(`/api/pages/${page.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: val }),
      })
    }, 500)
  }

  return (
    <div className="mb-8 group">
      <div className="mb-3">
        <button
          onClick={() => {
            const emoji = prompt('Enter an emoji for this page:', page.icon ?? '')
            if (emoji !== null) {
              fetch(`/api/pages/${page.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ icon: emoji }),
              })
            }
          }}
          className="text-5xl transition-opacity hover:opacity-70"
        >
          {page.icon || 'P'}
        </button>
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
