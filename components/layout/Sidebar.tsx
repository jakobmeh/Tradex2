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
        className={`group flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-sm transition-colors
          ${isActive ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        <button
          onClick={(e) => {
            e.preventDefault()
            setExpanded((p) => !p)
          }}
          className="w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-white shrink-0 text-xs"
        >
          {hasChildren ? (expanded ? '\u25be' : '\u25b8') : ''}
        </button>

        <Link href={`/dashboard/pages/${page.id}`} className="flex items-center gap-1.5 flex-1 truncate">
          <span className="text-sm">{page.icon ?? '\ud83d\udcc4'}</span>
          <span className="truncate">{page.title || 'Untitled'}</span>
        </Link>

        {hovering && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={createSubPage}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-zinc-600 text-zinc-400 hover:text-white text-xs"
            >
              +
            </button>
          </div>
        )}
      </div>

      {expanded && hasChildren && (
        <div>
          {page.children!.map((child) => (
            <PageItem key={child.id} page={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function safeParseJson(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export default function Sidebar({ workspace }: { workspace: Workspace }) {
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const createDatabase = async () => {
    const name = prompt('Database name:')
    if (!name) return

    const res = await fetch('/api/databases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })

    const text = await res.text()
    const db = text ? safeParseJson(text) : null

    if (!res.ok || !db?.id) {
      throw new Error(db?.error ?? 'Failed to create database')
    }

    router.push(`/dashboard/databases/${db.id}`)
    router.refresh()
  }

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
      <div className="w-10 h-screen bg-zinc-900 border-r border-zinc-800 flex flex-col items-center pt-4 gap-3">
        <button
          onClick={() => setCollapsed(false)}
          className="text-zinc-400 hover:text-white text-sm"
        >
          {'\u25b8'}
        </button>
      </div>
    )
  }

  return (
    <div className="w-60 shrink-0 h-screen bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="flex items-center justify-between px-3 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2 truncate">
          <span className="text-lg">{workspace.icon ?? '\ud83c\udfe0'}</span>
          <span className="text-sm font-medium text-white truncate">{workspace.name}</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="text-zinc-500 hover:text-white text-xs shrink-0"
        >
          {'\u2715'}
        </button>
      </div>

      <div className="px-2 py-2 border-b border-zinc-800">
        {[
          { href: '/dashboard', label: 'Home', icon: '\ud83c\udfe0' },
          { href: '/dashboard/search', label: 'Search', icon: '\ud83d\udd0d' },
          { href: '/dashboard/settings', label: 'Settings', icon: '\u2699\ufe0f' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors
              ${pathname === item.href ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
          >
            <span className="text-sm">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>

      <div className="px-2 pt-3">
        <div className="flex items-center justify-between px-2 mb-1">
          <p className="text-xs text-zinc-600 uppercase tracking-widest">Databases</p>
          <button
            onClick={createDatabase}
            className="text-zinc-500 hover:text-white text-sm leading-none"
          >
            +
          </button>
        </div>
        {workspace.databases.length === 0 ? (
          <p className="text-xs text-zinc-600 px-2 py-1">No databases yet</p>
        ) : (
          workspace.databases.map((db) => (
            <Link
              key={db.id}
              href={`/dashboard/databases/${db.id}`}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors
                ${pathname === `/dashboard/databases/${db.id}` ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
            >
              <span>{db.icon ?? '\ud83d\uddc4\ufe0f'}</span>
              <span className="truncate">{db.name}</span>
            </Link>
          ))
        )}
      </div>

      <div className="px-2 pt-3 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-2 mb-1">
          <p className="text-xs text-zinc-600 uppercase tracking-widest">Pages</p>
          <button onClick={createPage} className="text-zinc-500 hover:text-white text-sm leading-none">
            +
          </button>
        </div>
        {workspace.pages.length === 0 ? (
          <p className="text-xs text-zinc-600 px-2 py-1">No pages yet</p>
        ) : (
          workspace.pages.map((page) => <PageItem key={page.id} page={page} />)
        )}
      </div>

      <div className="p-2 border-t border-zinc-800">
        <button
          onClick={createPage}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <span>+</span> New page
        </button>
      </div>
    </div>
  )
}
