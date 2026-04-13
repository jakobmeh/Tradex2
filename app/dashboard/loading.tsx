export default function DashboardLoading() {
  return (
    <div className="max-w-3xl mx-auto py-10 sm:py-16 px-4 sm:px-8 animate-pulse">
      {/* Workspace + greeting */}
      <div className="h-3.5 w-28 bg-zinc-800 rounded mb-2" />
      <div className="h-9 w-72 bg-zinc-800 rounded mb-8" />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
            <div className="h-6 w-6 bg-zinc-800 rounded" />
            <div className="h-7 w-10 bg-zinc-800 rounded" />
            <div className="h-3 w-16 bg-zinc-800 rounded" />
          </div>
        ))}
      </div>

      {/* Recent pages label */}
      <div className="h-3 w-28 bg-zinc-800 rounded mb-3" />

      {/* Recent pages grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800"
          >
            <div className="h-6 w-6 shrink-0 bg-zinc-800 rounded" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="h-3.5 bg-zinc-800 rounded w-3/4" />
              <div className="h-2.5 bg-zinc-800 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <div className="h-9 w-32 bg-zinc-800 rounded-lg" />
      </div>
    </div>
  )
}
