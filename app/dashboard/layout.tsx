import { getCurrentWorkspace } from '@/lib/workspace'
import ShellLayout from '@/components/layout/ShellLayout'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [workspace, session] = await Promise.all([getCurrentWorkspace(), auth()])

  let isAdmin = false
  let sharedPages: { id: string; title: string; icon: string | null; sharedBy: { id: string; name: string | null; image: string | null } }[] = []

  if (session?.user?.id) {
    const [user, shares] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } }),
      prisma.pageShare.findMany({
        where: { sharedWithId: session.user.id },
        include: {
          page: { select: { id: true, title: true, icon: true, isDeleted: true } },
          sharedBy: { select: { id: true, name: true, image: true } },
        },
      }),
    ])
    isAdmin = user?.role === 'admin'
    sharedPages = shares
      .filter(s => !s.page.isDeleted)
      .map(s => ({ id: s.page.id, title: s.page.title, icon: s.page.icon, sharedBy: s.sharedBy }))
  }

  return (
    <ShellLayout workspace={workspace} isAdmin={isAdmin} sharedPages={sharedPages}>
      {children}
    </ShellLayout>
  )
}
