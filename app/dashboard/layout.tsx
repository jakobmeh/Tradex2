import { getCurrentWorkspace } from '@/lib/workspace'
import ShellLayout from '@/components/layout/ShellLayout'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const workspace = await getCurrentWorkspace()

  return (
    <ShellLayout workspace={workspace}>
      {children}
    </ShellLayout>
  )
}