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

  const [page, share] = await Promise.all([
    prisma.page.findFirst({
      where: {
        id,
        isDeleted: false,
        OR: [
          { workspace: { members: { some: { userId: session.user.id } } } },
          { shares: { some: { sharedWithId: session.user.id } } },
        ],
      },
      select: {
        id: true,
        title: true,
        icon: true,
        workspaceId: true,
        blocks: {
          where: { isDeleted: false, parentId: null },
          orderBy: { order: 'asc' },
          select: { id: true, type: true, content: true, order: true, pageId: true, parentId: true },
        },
      },
    }),
    prisma.pageShare.findUnique({
      where: { pageId_sharedWithId: { pageId: id, sharedWithId: session.user.id } },
      select: { role: true },
    }),
  ])

  if (!page) notFound()

  // owner = workspace member; shared viewer = read-only
  const isOwner = !share
  const canEdit = isOwner || share?.role === 'editor'

  return (
    <div className="px-4 sm:px-8 py-10 sm:py-16">
      <div className="mx-auto max-w-4xl">
        {canEdit ? (
          <PageHeader page={page} />
        ) : (
          <div className="mb-8">
            <div className="mb-3 text-5xl">{page.icon ?? '📄'}</div>
            <h1 className="break-words text-4xl font-bold text-white">{page.title || 'Untitled'}</h1>
            <p className="mt-2 text-xs text-zinc-600">You have view-only access to this page</p>
          </div>
        )}
      </div>
      <div className="mx-auto mt-2 max-w-[1400px]">
        <BlockEditor
          pageId={page.id}
          pageTitle={page.title ?? 'Untitled'}
          initialBlocks={page.blocks as import('@/lib/blocks').Block[]}
          readOnly={!canEdit}
        />
      </div>
    </div>
  )
}
