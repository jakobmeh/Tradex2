'use client'

import { useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function NewPostForm() {
  const router = useRouter()
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [pair, setPair] = useState('')
  const [direction, setDirection] = useState('')
  const [outcome, setOutcome] = useState('')
  const [pnl, setPnl] = useState('')
  const [description, setDescription] = useState('')
  const [dragging, setDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ status: string; aiReason?: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => setImageBase64(e.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) loadFile(file)
  }, [loadFile])

  const submit = async () => {
    if (submitting) return
    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageBase64 ?? undefined,
          pair: pair.trim() || undefined,
          direction: direction || undefined,
          outcome: outcome || undefined,
          pnl: pnl ? parseFloat(pnl) : undefined,
          description: description.trim() || undefined,
        }),
      })
      const data = await res.json() as { status: string; aiReason?: string }
      setResult(data)
      if (data.status === 'approved') {
        setTimeout(() => router.push('/community'), 1500)
      }
    } catch {
      setResult({ status: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const DIRECTIONS = ['long', 'short']
  const OUTCOMES = ['win', 'loss', 'be']

  return (
    <div className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
      {/* Image upload */}
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
          Chart screenshot
        </label>
        {imageBase64 ? (
          <div className="group relative rounded-xl overflow-hidden">
            <img src={imageBase64} alt="Preview" className="w-full rounded-xl object-cover max-h-64" />
            <button
              onClick={() => setImageBase64(null)}
              className="absolute right-2 top-2 rounded-lg bg-zinc-900/80 px-2 py-1 text-xs text-red-400 opacity-0 group-hover:opacity-100 transition-opacity border border-zinc-700"
            >
              Remove
            </button>
          </div>
        ) : (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-10 text-center transition-colors ${
              dragging ? 'border-zinc-400 bg-zinc-800/60' : 'border-zinc-700 bg-zinc-900/40 hover:border-zinc-600'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f) }}
            />
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p className="text-sm text-zinc-500">Click, drag or paste chart screenshot</p>
          </div>
        )}
      </div>

      {/* Pair */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">Pair</label>
          <input
            value={pair}
            onChange={e => setPair(e.target.value.toUpperCase())}
            placeholder="EURUSD, BTCUSDT…"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">P&L (R)</label>
          <input
            type="number"
            step="0.1"
            value={pnl}
            onChange={e => setPnl(e.target.value)}
            placeholder="e.g. 2.5"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
          />
        </div>
      </div>

      {/* Direction + Outcome */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">Direction</label>
          <div className="flex gap-1.5">
            {DIRECTIONS.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setDirection(prev => prev === d ? '' : d)}
                className={`flex-1 rounded-xl border py-2 text-xs font-semibold uppercase transition ${
                  direction === d
                    ? d === 'long' ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-red-500/50 bg-red-500/10 text-red-400'
                    : 'border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">Outcome</label>
          <div className="flex gap-1.5">
            {OUTCOMES.map(o => (
              <button
                key={o}
                type="button"
                onClick={() => setOutcome(prev => prev === o ? '' : o)}
                className={`flex-1 rounded-xl border py-2 text-xs font-semibold uppercase transition ${
                  outcome === o
                    ? o === 'win' ? 'border-green-500/50 bg-green-500/10 text-green-400'
                      : o === 'loss' ? 'border-red-500/50 bg-red-500/10 text-red-400'
                      : 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
                    : 'border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                }`}
              >
                {o === 'be' ? 'BE' : o}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
          Description <span className="text-zinc-700">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder="Setup, analysis, notes…"
          className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
        />
      </div>

      {/* Result feedback */}
      {result && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${
          result.status === 'approved'
            ? 'border-green-500/30 bg-green-500/10 text-green-400'
            : result.status === 'rejected'
            ? 'border-red-500/30 bg-red-500/10 text-red-400'
            : 'border-zinc-700 bg-zinc-800 text-zinc-400'
        }`}>
          {result.status === 'approved' && 'Post approved! Redirecting to community…'}
          {result.status === 'rejected' && `Post rejected: ${result.aiReason ?? 'Content policy violation'}`}
          {result.status === 'error' && 'Something went wrong. Please try again.'}
        </div>
      )}

      <button
        onClick={() => void submit()}
        disabled={submitting || (!imageBase64 && !description.trim())}
        className="w-full rounded-xl bg-[linear-gradient(90deg,#8b6122,#d5aa5e,#f0d289)] py-3 text-sm font-semibold text-[#140d05] shadow-[0_8px_20px_rgba(169,124,40,0.22)] transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting & checking…' : 'Submit post'}
      </button>

      <p className="text-center text-xs text-zinc-700">
        AI will review your post automatically. Approved posts appear instantly.
      </p>
    </div>
  )
}
