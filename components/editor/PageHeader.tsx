'use client'
import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { usePageTitles } from '@/lib/page-title-context'
import type { EmojiClickData } from 'emoji-picker-react'
import { Theme } from 'emoji-picker-react'

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false })

type Page = { id: string; title: string; icon: string | null }
type Friend = { id: string; name: string | null; image: string | null }

function FriendAvatar({ f }: { f: Friend }) {
  if (f.image) return <Image src={f.image} alt={f.name ?? ''} width={28} height={28} className="rounded-full shrink-0 object-cover" />
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-300">
      {f.name?.charAt(0).toUpperCase() ?? '?'}
    </div>
  )
}

export default function PageHeader({ page }: { page: Page }) {
  const editableRef = useRef<HTMLDivElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const shareRef = useRef<HTMLDivElement>(null)
  const { setTitle } = usePageTitles()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [friends, setFriends] = useState<Friend[]>([])
  const [sendingTo, setSendingTo] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<Record<string, string>>({})
  const [roles, setRoles] = useState<Record<string, 'viewer' | 'editor'>>({})
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
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pickerOpen])

  useEffect(() => {
    if (!shareOpen) return
    const handler = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShareOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [shareOpen])

  const openShare = async () => {
    if (!shareOpen && friends.length === 0) {
      const res = await fetch('/api/friends')
      const data = await res.json() as { friends: (Friend & { friendshipId: string })[] }
      setFriends(data.friends ?? [])
    }
    setShareOpen(p => !p)
  }

  const shareWithFriend = async (friendId: string) => {
    if (sendingTo) return
    setSendingTo(friendId)
    const role = roles[friendId] ?? 'viewer'
    await fetch(`/api/pages/${page.id}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendId, role }),
    })
    setSentTo(prev => ({ ...prev, [friendId]: role }))
    setSendingTo(null)
  }

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

      <div className="flex items-start gap-3">
        <div
          ref={editableRef}
          contentEditable
          suppressContentEditableWarning
          onInput={e => saveTitle(e.currentTarget.textContent ?? '')}
          onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
          data-placeholder="Untitled"
          dir="ltr"
          style={{ direction: 'ltr', unicodeBidi: 'plaintext', textAlign: 'left' }}
          className="flex-1 break-words text-4xl font-bold text-white outline-none empty:before:text-zinc-700 empty:before:content-[attr(data-placeholder)]"
        >
          {page.title}
        </div>

        {/* Share with friend button */}
        <div className="relative mt-3 shrink-0" ref={shareRef}>
          <button
            onClick={() => void openShare()}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-3 py-1.5 text-xs text-zinc-400 opacity-0 transition hover:border-zinc-600 hover:text-zinc-200 group-hover:opacity-100"
            title="Share with a friend"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="2" r="1.5" />
              <circle cx="9" cy="10" r="1.5" />
              <circle cx="2" cy="6" r="1.5" />
              <path d="M3.5 5.1L7.5 3M3.5 6.9L7.5 9" />
            </svg>
            Share
          </button>

          {shareOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-zinc-700 bg-zinc-900 p-2 shadow-xl">
              <p className="mb-2 px-2 text-[10px] uppercase tracking-widest text-zinc-600">Share with friend</p>
              {friends.length === 0 ? (
                <p className="px-2 py-3 text-xs text-zinc-600">No friends yet — add some first</p>
              ) : (
                <div className="space-y-1">
                  {friends.map(f => {
                    const alreadySent = sentTo[f.id]
                    const role = roles[f.id] ?? 'viewer'
                    return (
                      <div key={f.id} className="rounded-xl px-2 py-2 transition hover:bg-zinc-800">
                        <div className="flex items-center gap-2.5">
                          <FriendAvatar f={f} />
                          <span className="flex-1 truncate text-sm text-zinc-200">{f.name ?? 'Unknown'}</span>
                          {alreadySent ? (
                            <span className="text-xs text-green-400">
                              {alreadySent === 'editor' ? 'Editor ✓' : 'Viewer ✓'}
                            </span>
                          ) : (
                            <button
                              onClick={() => void shareWithFriend(f.id)}
                              disabled={sendingTo === f.id}
                              className="rounded-lg bg-[linear-gradient(90deg,#8b6122,#d5aa5e)] px-2.5 py-1 text-xs font-semibold text-[#140d05] transition hover:brightness-110 disabled:opacity-40"
                            >
                              {sendingTo === f.id ? '…' : 'Share'}
                            </button>
                          )}
                        </div>
                        {!alreadySent && (
                          <div className="mt-1.5 flex gap-1 pl-9">
                            <button
                              onClick={() => setRoles(prev => ({ ...prev, [f.id]: 'viewer' }))}
                              className={`rounded-lg border px-2 py-0.5 text-[11px] transition ${role === 'viewer' ? 'border-[#a37b34]/60 bg-[#a37b34]/20 text-[#f0d289]' : 'border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'}`}
                            >
                              👁 Viewer
                            </button>
                            <button
                              onClick={() => setRoles(prev => ({ ...prev, [f.id]: 'editor' }))}
                              className={`rounded-lg border px-2 py-0.5 text-[11px] transition ${role === 'editor' ? 'border-[#a37b34]/60 bg-[#a37b34]/20 text-[#f0d289]' : 'border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'}`}
                            >
                              ✏️ Editor
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
