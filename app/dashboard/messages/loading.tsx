export default function MessagesLoading() {
  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-8 sm:py-12 animate-pulse">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="h-2.5 w-12 bg-zinc-800 rounded mb-2" />
          <div className="h-7 w-28 bg-zinc-800 rounded" />
        </div>
        <div className="h-8 w-16 bg-zinc-800 rounded-xl" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-zinc-800">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`flex items-center gap-3 px-4 py-3.5 ${i !== 0 ? 'border-t border-zinc-800' : ''}`}>
            <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-800" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-3.5 w-24 bg-zinc-800 rounded" />
              <div className="h-3 w-40 bg-zinc-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
