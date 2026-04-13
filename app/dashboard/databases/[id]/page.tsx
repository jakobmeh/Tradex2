import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import DatabaseTable from '@/components/database/DatabaseTable'

export default async function DatabasePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const { id } = await params

  const database = await prisma.database.findUnique({
    where: { id },
    include: {
      properties: { orderBy: { order: 'asc' } },
      views: true,
      entries: {
        where: { isDeleted: false },
        orderBy: { order: 'asc' },
        include: { values: { include: { property: true } } },
      },
    },
  })
  if (!database) notFound()

  return (
    <div className="flex flex-col h-screen">
      <DatabaseTable initial={database} />
    </div>
  )
}
