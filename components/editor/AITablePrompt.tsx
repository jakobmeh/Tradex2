'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  initialPrompt: string
  loading: boolean
  error: string | null
  onClose: () => void
  onSubmit: (prompt: string) => Promise<void>
}

const STAGES = [
  { label: 'Analyzing your prompt...', pct: 22, delay: 700 },
  { label: 'Designing table structure...', pct: 58, delay: 2400 },
  { label: 'Populating with data...', pct: 88, delay: 4600 },
]

export default function AITablePrompt({ initialPrompt, loading, error, onClose, onSubmit }: Props) {
  const [prompt, setPrompt] = useState(initialPrompt)
  const [stageIdx, setStageIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    setPrompt(initialPrompt)
  }, [initialPrompt])

  useEffect(() => {
    // Clear any previous timers
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    if (!loading) {
      setStageIdx(0)
      setProgress(0)
      return
    }

    // Kick off progress immediately
    setProgress(6)
    setStageIdx(0)

    STAGES.forEach((stage, i) => {
      const t = setTimeout(() => {
        setStageIdx(i)
        setProgress(stage.pct)
      }, stage.delay)
      timersRef.current.push(t)
    })

    return () => {
      timersRef.current.forEach(clearTimeout)
    }
  }, [loading])

  const currentStage = STAGES[stageIdx]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="border-b border-zinc-800 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">Generate AI Table</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Describe the table you want and AI will create the database for this page.
          </p>
        </div>

        <div className="px-5 py-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            placeholder="Example: Create a gold trading journal with direction, entry, stop loss, take profit, result, setup type, date, notes, and screenshot link."
            className="min-h-40 w-full resize-y rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 disabled:opacity-50 disabled:resize-none"
          />

          {/* Progress section — visible only while loading */}
          {loading && (
            <div className="mt-4 space-y-2">
              {/* Stage label */}
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300 shrink-0" />
                <p className="text-sm text-zinc-300">{currentStage.label}</p>
              </div>

              {/* Steps */}
              <div className="flex items-center gap-2 mt-1">
                {STAGES.map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div
                      className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                        i <= stageIdx ? 'bg-blue-400' : 'bg-zinc-700'
                      }`}
                    />
                    <span
                      className={`text-[11px] transition-colors duration-300 ${
                        i <= stageIdx ? 'text-zinc-400' : 'text-zinc-600'
                      }`}
                    >
                      {i === 0 ? 'Analyze' : i === 1 ? 'Structure' : 'Populate'}
                    </span>
                    {i < STAGES.length - 1 && (
                      <div
                        className={`h-px w-4 transition-colors duration-300 ${
                          i < stageIdx ? 'bg-blue-400/50' : 'bg-zinc-700'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="h-1 w-full rounded-full bg-zinc-800 overflow-hidden mt-2">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="text-xs text-zinc-600">
                Step {stageIdx + 1} of {STAGES.length} — this usually takes 10–20 seconds
              </p>
            </div>
          )}

          {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-zinc-800 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !prompt.trim()}
            onClick={() => onSubmit(prompt)}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Generating...' : 'Generate table'}
          </button>
        </div>
      </div>
    </div>
  )
}
