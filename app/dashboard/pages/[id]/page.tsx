import { auth } from '@/auth'
import BlockEditor from '@/components/editor/BlockEditor'
import PageHeader from '@/components/editor/PageHeader'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'

export default async function DashboardPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params
  const page = await prisma.page.findFirst({
    where: {
      id,
      isDeleted: false,
      workspace: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
    },
    select: {
      id: true,
      title: true,
      icon: true,
    },
  })

  if (!page) notFound()

  return (
    <div className="mx-auto max-w-4xl px-8 py-16">
      <PageHeader page={page} />
      <BlockEditor pageId={page.id} />
    </div>
  )
}
