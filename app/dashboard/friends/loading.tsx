export default function FriendsLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8 sm:py-12 animate-pulse">
      <div className="mb-6">
        <div className="h-2.5 w-12 bg-zinc-800 rounded mb-2" />
        <div className="h-7 w-24 bg-zinc-800 rounded" />
      </div>
      <div className="space-y-2">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="h-9 w-9 shrink-0 rounded-full bg-zinc-800" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-3.5 w-32 bg-zinc-800 rounded" />
              <div className="h-3 w-48 bg-zinc-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
