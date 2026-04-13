'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

type Page = {
  id: string
  title: string
  icon: string | null
  children?: Page[]
}

type Database = {
  id: string
  name: string
  icon: string | null
}

type Workspace = {
  id: string
  name: string
  icon: string | null
  pages: Page[]
  databases: Database[]
}

function navItemClasses(active: boolean) {
  return active
    ? 'border-[#a37b34]/34 bg-[linear-gradient(180deg,rgba(214,173,88,0.16),rgba(88,60,18,0.18))] text-[#fff0c7] shadow-[inset_0_1px_0_rgba(255,240,199,0.06)]'
    : 'border-transparent text-[#ccb98f]/64 hover:border-[#7e6330]/22 hover:bg-[linear-gradient(180deg,rgba(22,22,22,0.95),rgba(9,9,9,0.96))] hover:text-[#fff0c7]'
}

function PageItem({ page, depth = 0 }: { page: Page; depth?: number }) {
  const [expanded, setExpanded] = useState(false)
  const [hovering, setHovering] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const isActive = pathname === `/dashboard/pages/${page.id}`
  const hasChildren = (page.children?.length ?? 0) > 0

  const createSubPage = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const res = await fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled', parentId: page.id }),
    })
    const newPage = await res.json()
    setExpanded(true)
    router.push(`/dashboard/pages/${newPage.id}`)
    router.refresh()
  }

  return (
    <div>
      <div
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className={`group flex items-center gap-1 rounded-xl border px-2 py-1.5 text-sm transition-colors ${navItemClasses(isActive)}`}
        style={{ paddingLeft: `${10 + depth * 16}px` }}
      >
        <button
          onClick={(e) => {
            e.preventDefault()
            setExpanded((prev) => !prev)
          }}
          className="flex h-4 w-4 shrink-0 items-center justify-center text-[10px] text-[#8d7547] hover:text-[#fff0c7]"
        >
          {hasChildren ? (expanded ? '\u25be' : '\u25b8') : ''}
        </button>

        <Link href={`/dashboard/pages/${page.id}`} className="flex min-w-0 flex-1 items-center gap-2 truncate">
          <span className="text-sm">{page.icon ?? '\ud83d\udcc4'}</span>
          <span className="truncate">{page.title || 'Untitled'}</span>
        </Link>

        {hovering ? (
          <button
            onClick={createSubPage}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-xs text-[#a88a4f] transition hover:bg-[#1a1712] hover:text-[#fff0c7]"
          >
            +
          </button>
        ) : null}
      </div>

      {expanded && hasChildren ? (
        <div className="mt-1 space-y-1">
          {page.children!.map((child) => (
            <PageItem key={child.id} page={child} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function Sidebar({ workspace, onMobileClose }: { workspace: Workspace; onMobileClose?: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const createPage = async () => {
    const res = await fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled' }),
    })
    const page = await res.json()
    router.push(`/dashboard/pages/${page.id}`)
    router.refresh()
  }

  if (collapsed) {
    return (
      <div className="flex h-screen w-12 flex-col items-center gap-3 border-r border-[#6f592d]/18 bg-[linear-gradient(180deg,rgba(14,14,14,0.98),rgba(7,7,7,0.98))] pt-4">
        <button
          onClick={() => setCollapsed(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#6f592d]/24 text-sm text-[#d5b46f] transition hover:border-[#9f7c3a]/45 hover:text-[#fff0c7]"
        >
          {'\u25b8'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-72 shrink-0 flex-col border-r border-[#6f592d]/18 bg-[linear-gradient(180deg,rgba(15,15,15,0.98),rgba(8,8,8,0.98))] text-[#f8edd2] backdrop-blur-xl">
      <div className="border-b border-[#6f592d]/18 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.32em] text-[#b6985d]/58">
              Workspace
            </p>
            <div className="mt-2 flex items-center gap-2 truncate">
              <span className="text-lg">{workspace.icon ?? '\ud83c\udfe0'}</span>
              <span className="truncate text-sm font-medium text-[#fff0c7]">{workspace.name}</span>
            </div>
          </div>
          <button
            onClick={() => onMobileClose ? onMobileClose() : setCollapsed(true)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#6f592d]/20 text-xs text-[#a98b4e] transition hover:border-[#9f7c3a]/45 hover:text-[#fff0c7]"
          >
            {'\u2715'}
          </button>
        </div>
      </div>

      <div className="space-y-6 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {[
            { href: '/dashboard', label: 'Home', icon: '\ud83c\udfe0' },
            { href: '/dashboard/search', label: 'Search', icon: '\ud83d\udd0d' },
            { href: '/dashboard/settings', label: 'Settings', icon: '\u2699\ufe0f' },
            { href: '/dashboard/trash', label: 'Trash', icon: '\ud83d\uddd1\ufe0f' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors ${navItemClasses(pathname === item.href)}`}
            >
              <span className="text-sm">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        <section className="flex min-h-0 flex-1 flex-col">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#9e8350]/52">Pages</p>
            <button
              onClick={createPage}
              className="text-sm text-[#b99652] transition hover:text-[#fff0c7]"
            >
              +
            </button>
          </div>
          <div className="space-y-1">
            {workspace.pages.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#6f592d]/18 px-3 py-3 text-xs text-[#8e7a55]">
                No pages yet
              </p>
            ) : (
              workspace.pages.map((page) => <PageItem key={page.id} page={page} />)
            )}
          </div>
        </section>
      </div>

      <div className="border-t border-[#6f592d]/18 p-3">
        <button
          onClick={createPage}
          className="inline-flex h-11 w-full items-center justify-center rounded-[1rem] bg-[linear-gradient(90deg,#8b6122,#d5aa5e,#f0d289)] px-4 text-sm font-semibold text-[#140d05] shadow-[0_14px_30px_rgba(169,124,40,0.22)] transition hover:brightness-110"
        >
          + New page
        </button>
      </div>
    </div>
  )
}
