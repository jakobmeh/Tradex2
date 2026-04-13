'use client'

import { useEffect, useState } from 'react'

type Props = {
  initialPrompt: string
  loading: boolean
  error: string | null
  onClose: () => void
  onSubmit: (prompt: string) => Promise<void>
}

export default function AITablePrompt({ initialPrompt, loading, error, onClose, onSubmit }: Props) {
  const [prompt, setPrompt] = useState(initialPrompt)

  useEffect(() => {
    setPrompt(initialPrompt)
  }, [initialPrompt])

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
            placeholder="Example: Create a gold trading journal with direction, entry, stop loss, take profit, result, setup type, date, notes, and screenshot link."
            className="min-h-40 w-full resize-y rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
          />

          {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-zinc-800 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-white"
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
