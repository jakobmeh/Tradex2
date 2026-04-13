'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Page = { id: string; title: string; icon: string | null; updatedAt: Date }

export default function TrashClient({ pages }: { pages: Page[] }) {
  const [items, setItems] = useState(pages)
  const router = useRouter()

  const restore = async (id: string) => {
    await fetch(`/api/pages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDeleted: false }),
    })
    setItems((prev) => prev.filter((item) => item.id !== id))
    router.refresh()
  }

  const deletePermanently = async (id: string) => {
    if (!confirm('Delete permanently? This cannot be undone.')) return
    await fetch(`/api/pages/${id}/permanent`, { method: 'DELETE' })
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8 sm:py-14">
      <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)] md:p-8 lg:p-10">
        <p className="text-xs uppercase tracking-[0.34em] text-zinc-500">Recovery Zone</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">Trash</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
          Restore deleted pages or remove them permanently.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="mt-6 rounded-[1.8rem] border border-dashed border-zinc-800 bg-zinc-900 px-6 py-16 text-center shadow-[0_25px_70px_rgba(0,0,0,0.28)]">
          <p className="text-5xl">\ud83d\uddd1\ufe0f</p>
          <p className="mt-4 text-lg text-white">Trash is empty</p>
          <p className="mt-2 text-sm text-zinc-500">Deleted pages will appear here.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((page) => (
            <div
              key={page.id}
              className="group flex items-center gap-4 rounded-[1.4rem] border border-zinc-800 bg-zinc-900 px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.24)]"
            >
              <span className="text-2xl">{page.icon ?? '\ud83d\udcc4'}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{page.title || 'Untitled'}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {new Date(page.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <button
                  onClick={() => restore(page.id)}
                  className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                >
                  Restore
                </button>
                <button
                  onClick={() => deletePermanently(page.id)}
                  className="rounded-full border border-red-500/18 px-3 py-1.5 text-xs text-red-300 transition hover:border-red-400/36 hover:text-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
