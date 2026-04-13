import { getCurrentWorkspace } from '@/lib/workspace'

export default async function DashboardPage() {
  const workspace = await getCurrentWorkspace()

  return (
    <div className="max-w-2xl mx-auto py-20 px-8">
      <p className="text-zinc-500 text-sm mb-2">{workspace.name}</p>
      <h1 className="text-3xl font-semibold text-white mb-8">Good to see you 👋</h1>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-zinc-400 text-sm">Pages</p>
          <p className="text-2xl font-semibold text-white mt-1">{workspace.pages.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-zinc-400 text-sm">Databases</p>
          <p className="text-2xl font-semibold text-white mt-1">{workspace.databases.length}</p>
        </div>
      </div>
    </div>
  )
}