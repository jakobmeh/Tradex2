import { getCurrentWorkspace } from '@/lib/workspace'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const workspace = await getCurrentWorkspace()

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      <Sidebar workspace={workspace} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}