'use client'

import { useEffect, useState } from 'react'

type Alarm = {
  id: string
  title: string
  message: string
  time: string
  days: string
  isActive: boolean
  lastSentAt: string | null
  createdAt: string
}

const DAY_LABELS: Record<string, string> = {
  daily: 'Every day',
  weekdays: 'Weekdays (Mon–Fri)',
  weekends: 'Weekends (Sat–Sun)',
}

export default function AlarmsPage() {
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [sentMsg, setSentMsg] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [time, setTime] = useState('08:00')
  const [days, setDays] = useState('daily')

  useEffect(() => {
    fetch('/api/alarms')
      .then(r => r.ok ? r.json() : Promise.resolve([]))
      .then((data: Alarm[]) => setAlarms(Array.isArray(data) ? data : []))
      .catch(() => setAlarms([]))
      .finally(() => setLoading(false))
  }, [])

  const create = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    const res = await fetch('/api/alarms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message, time, days }),
    })
    const alarm: Alarm = await res.json()
    setAlarms(prev => [alarm, ...prev])
    setTitle('')
    setMessage('')
    setTime('08:00')
    setDays('daily')
    setSaving(false)
  }

  const toggle = async (alarm: Alarm) => {
    const updated = { ...alarm, isActive: !alarm.isActive }
    setAlarms(prev => prev.map(a => a.id === alarm.id ? updated : a))
    await fetch(`/api/alarms/${alarm.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !alarm.isActive }),
    })
  }

  const remove = async (id: string) => {
    setAlarms(prev => prev.filter(a => a.id !== id))
    await fetch(`/api/alarms/${id}`, { method: 'DELETE' })
  }

  const sendNow = async (id: string) => {
    setSending(id)
    setSentMsg(null)
    await fetch(`/api/alarms/${id}/send`, { method: 'POST' })
    setSending(null)
    setSentMsg(id)
    setTimeout(() => setSentMsg(null), 3000)
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Reminders</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Set up email reminders. Times are in <strong className="text-zinc-400">UTC</strong>.
        </p>
      </div>

      {/* Create form */}
      <form onSubmit={e => void create(e)} className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <p className="mb-4 text-xs font-medium uppercase tracking-widest text-zinc-500">New reminder</p>

        <div className="mb-3">
          <label className="mb-1 block text-xs text-zinc-400">Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Log today's trade"
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500"
          />
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-xs text-zinc-400">Message (optional)</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="e.g. Don't forget to record your P&L and notes!"
            rows={2}
            className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500"
          />
        </div>

        <div className="mb-4 flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-zinc-400">Time (UTC)</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-zinc-400">Repeat</label>
            <select
              value={days}
              onChange={e => setDays(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
            >
              <option value="daily">Every day</option>
              <option value="weekdays">Weekdays (Mon–Fri)</option>
              <option value="weekends">Weekends (Sat–Sun)</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Create reminder'}
        </button>
      </form>

      {/* List */}
      {loading ? (
        <p className="text-sm text-zinc-600">Loading…</p>
      ) : alarms.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-600">
          No reminders yet — create one above.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {alarms.map(alarm => (
            <div
              key={alarm.id}
              className={`flex items-start gap-4 rounded-xl border px-4 py-4 transition ${
                alarm.isActive ? 'border-zinc-700 bg-zinc-900/50' : 'border-zinc-800 bg-zinc-900/20 opacity-50'
              }`}
            >
              {/* Toggle */}
              <button
                onClick={() => void toggle(alarm)}
                title={alarm.isActive ? 'Disable' : 'Enable'}
                className={`mt-0.5 h-5 w-9 shrink-0 rounded-full border transition-colors ${
                  alarm.isActive ? 'border-blue-500 bg-blue-600' : 'border-zinc-600 bg-zinc-800'
                }`}
              >
                <div className={`mx-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${alarm.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>

              <div className="min-w-0 flex-1">
                <p className="font-medium text-white">{alarm.title}</p>
                {alarm.message && <p className="mt-0.5 text-sm text-zinc-400">{alarm.message}</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                    ⏰ {(() => { const [h,m]=alarm.time.split(':').map(Number); const d=new Date(); d.setUTCHours(h,m,0,0); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` })()}
                  </span>
                  <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                    {DAY_LABELS[alarm.days] ?? alarm.days}
                  </span>
                  {alarm.lastSentAt && (
                    <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                      Last sent: {new Date(alarm.lastSentAt).toLocaleDateString()}
                    </span>
                  )}
                  {sentMsg === alarm.id && (
                    <span className="rounded-md bg-green-900/50 px-2 py-0.5 text-xs text-green-400">✓ Email sent!</span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-1">
                <button
                  onClick={() => void sendNow(alarm.id)}
                  disabled={sending === alarm.id}
                  title="Send email now"
                  className="rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:opacity-40"
                >
                  {sending === alarm.id ? '…' : 'Send now'}
                </button>
                <button
                  onClick={() => void remove(alarm.id)}
                  className="rounded-lg p-1.5 text-zinc-600 transition hover:bg-red-950/50 hover:text-red-400"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <polyline points="2,4 12,4" />
                    <path d="M5 4V2h4v2" />
                    <rect x="3" y="4" width="8" height="8" rx="1" />
                    <line x1="5.5" y1="7" x2="5.5" y2="10" />
                    <line x1="8.5" y1="7" x2="8.5" y2="10" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
