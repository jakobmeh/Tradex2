export default function PageLoading() {
  return (
    <div className="px-8 py-16 animate-pulse">
      <div className="mx-auto max-w-4xl mb-8">
        {/* Page icon */}
        <div className="h-14 w-14 bg-zinc-800 rounded-xl mb-4" />
        {/* Page title */}
        <div className="h-10 bg-zinc-800 rounded-lg w-80" />
      </div>

      <div className="mx-auto max-w-[1400px] pl-8 space-y-3 mt-6">
        {/* Simulated block lines at varying widths */}
        {[82, 68, 91, 55, 75, 48, 85, 62].map((w, i) => (
          <div
            key={i}
            className="h-5 bg-zinc-800/70 rounded"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </div>
  )
}
