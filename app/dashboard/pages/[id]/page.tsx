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
      blocks: {
        where: {
          isDeleted: false,
          parentId: null,
        },
        orderBy: {
          order: 'asc',
        },
        select: {
          id: true,
          type: true,
          content: true,
          order: true,
          pageId: true,
          parentId: true,
        },
      },
    },
  })

  if (!page) notFound()

  return (
    <div className="px-4 sm:px-8 py-10 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <PageHeader page={page} />
      </div>
      <div className="mx-auto mt-2 max-w-[1400px]">
        <BlockEditor pageId={page.id} pageTitle={page.title ?? 'Untitled'} initialBlocks={page.blocks as import('@/lib/blocks').Block[]} />
      </div>
    </div>
  )
}
