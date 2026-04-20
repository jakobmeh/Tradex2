'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type MessageUser = { id: string; name: string | null; image: string | null }
type Message = {
  id: string
  content: string
  senderId: string
  createdAt: string
  sender: MessageUser
}

function Avatar({ user, size = 32 }: { user: MessageUser; size?: number }) {
  if (user.image) return <Image src={user.image} alt={user.name ?? ''} width={size} height={size} className="rounded-full shrink-0 object-cover" style={{ width: size, height: size }} />
  return (
    <div className="flex shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-300" style={{ width: size, height: size }}>
      {user.name?.charAt(0).toUpperCase() ?? '?'}
    </div>
  )
}

export default function ConversationClient({
  otherUser,
  currentUserId,
}: {
  otherUser: MessageUser
  currentUserId: string
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastCreatedAt = useRef<string | null>(null)

  const loadMessages = useCallback(async (initial = false) => {
    const url = initial
      ? `/api/messages?with=${otherUser.id}`
      : `/api/messages?with=${otherUser.id}${lastCreatedAt.current ? `&after=${encodeURIComponent(lastCreatedAt.current)}` : ''}`
    const res = await fetch(url)
    if (!res.ok) return
    const data = await res.json() as Message[]
    if (initial) {
      setMessages(data)
      if (data.length > 0) lastCreatedAt.current = data[data.length - 1].createdAt
    } else if (data.length > 0) {
      setMessages(prev => [...prev, ...data])
      lastCreatedAt.current = data[data.length - 1].createdAt
    }
  }, [otherUser.id])

  useEffect(() => { void loadMessages(true) }, [loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const interval = setInterval(() => void loadMessages(false), 3000)
    return () => clearInterval(interval)
  }, [loadMessages])

  const send = async () => {
    const content = input.trim()
    if (!content || sending) return
    setSending(true)
    setInput('')
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: otherUser.id, content }),
      })
      if (res.ok) {
        const msg = await res.json() as Message
        setMessages(prev => [...prev, msg])
        lastCreatedAt.current = msg.createdAt
      }
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const timeLabel = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col md:h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur">
        <Link href="/dashboard/messages" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-zinc-800 text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-200">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 2L4 7l5 5" />
          </svg>
        </Link>
        <Avatar user={otherUser} size={34} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{otherUser.name ?? 'Unknown'}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-600">No messages yet — say hi!</p>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.senderId === currentUserId
          const prevMsg = messages[i - 1]
          const showTime = !prevMsg || new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 5 * 60 * 1000

          return (
            <div key={msg.id}>
              {showTime && (
                <p className="py-3 text-center text-[11px] text-zinc-700">{timeLabel(msg.createdAt)}</p>
              )}
              <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                {!isMe && <Avatar user={msg.sender} size={26} />}
                <div className={`max-w-[72%] rounded-2xl px-3.5 py-2 text-sm ${
                  isMe
                    ? 'rounded-br-sm bg-[linear-gradient(135deg,#8b6122,#c9993e)] text-[#fdf3d8]'
                    : 'rounded-bl-sm bg-zinc-800 text-zinc-100'
                }`}>
                  <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && void send()}
            placeholder={`Message ${otherUser.name ?? ''}…`}
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-[#6f592d]/60"
          />
          <button
            onClick={() => void send()}
            disabled={sending || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#8b6122,#d5aa5e)] text-[#140d05] transition hover:brightness-110 disabled:opacity-40"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 1L1 5.5l5 2 2 5L13 1Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
