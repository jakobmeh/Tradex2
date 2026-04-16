'use client'

import Image from 'next/image'
import { useState } from 'react'
import Sidebar from './Sidebar'
import dashboardBackground from '../../image.png'
import { PageTitleProvider } from '@/lib/page-title-context'
import { DatabaseRefreshProvider } from '@/lib/database-refresh-context'

type Page = { id: string; title: string; icon: string | null; children?: Page[] }
type Database = { id: string; name: string; icon: string | null }
type Workspace = {
  id: string
  name: string
  icon: string | null
  pages: Page[]
  databases: Database[]
}

export default function ShellLayout({
  workspace,
  children,
}: {
  workspace: Workspace
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <PageTitleProvider>
    <DatabaseRefreshProvider>
    <div className="relative flex h-screen overflow-hidden bg-[linear-gradient(180deg,#030303_0%,#070605_46%,#020202_100%)] text-[#f8edd2]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <Image
          src={dashboardBackground}
          alt=""
          fill
          priority
          className="object-cover object-center opacity-[0.16] mix-blend-screen"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_34%,rgba(232,184,74,0.14),transparent_44%),radial-gradient(circle_at_20%_60%,rgba(184,131,41,0.09),transparent_48%)]" />
        <div className="absolute inset-x-0 top-0 h-[300px] bg-[linear-gradient(180deg,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.74)_58%,rgba(0,0,0,0)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.35)_40%,rgba(0,0,0,0.9)_100%)]" />
        <div className="absolute inset-y-0 left-0 w-[24rem] bg-[linear-gradient(90deg,rgba(0,0,0,0.32),rgba(0,0,0,0.06)_52%,transparent)]" />
      </div>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div
        className={[
          'fixed inset-y-0 left-0 z-50',
          'md:relative md:inset-auto md:z-auto',
          'transition-transform duration-200 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        <Sidebar workspace={workspace} onMobileClose={() => setMobileOpen(false)} />
      </div>

      <main className="relative flex-1 min-w-0 overflow-y-auto">
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[#7e6330]/18 bg-[linear-gradient(180deg,rgba(10,10,10,0.95),rgba(6,6,6,0.86))] px-4 backdrop-blur-xl md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#6f592d]/30 bg-black/30 text-[#d6bc82] transition hover:border-[#9f7c3a]/55 hover:text-[#fff0c7]"
            aria-label="Open menu"
          >
            <svg
              width="16"
              height="12"
              viewBox="0 0 16 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <line x1="0" y1="1" x2="16" y2="1" />
              <line x1="0" y1="6" x2="16" y2="6" />
              <line x1="0" y1="11" x2="16" y2="11" />
            </svg>
          </button>
          <span className="truncate text-sm text-[#e9d5a4]">
            {workspace.icon ?? 'A'} {workspace.name}
          </span>
        </div>

        {children}
      </main>
    </div>
    </DatabaseRefreshProvider>
    </PageTitleProvider>
  )
}
