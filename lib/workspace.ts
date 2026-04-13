import { auth, ensureWorkspace } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function getCurrentWorkspace() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  let member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: {
      workspace: {
        include: {
          pages: {
            where: { parentId: null, isDeleted: false },
            orderBy: { order: 'asc' },
            include: {
              children: {
                where: { isDeleted: false },
                orderBy: { order: 'asc' },
                include: {
                  children: {
                    where: { isDeleted: false },
                    orderBy: { order: 'asc' },
                  },
                },
              },
            },
          },
          databases: {
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  })

  if (!member) {
    await ensureWorkspace(session.user.id, session.user.name)

    member = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      include: {
        workspace: {
          include: {
            pages: {
              where: { parentId: null, isDeleted: false },
              orderBy: { order: 'asc' },
              include: {
                children: {
                  where: { isDeleted: false },
                  orderBy: { order: 'asc' },
                  include: {
                    children: {
                      where: { isDeleted: false },
                      orderBy: { order: 'asc' },
                    },
                  },
                },
              },
            },
            databases: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    })
  }

  if (!member) redirect('/login')
  return member.workspace
}
