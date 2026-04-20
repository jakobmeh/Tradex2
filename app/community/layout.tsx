import Link from 'next/link'
import { auth } from '@/auth'

export default async function CommunityLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#030303_0%,#070605_46%,#020202_100%)] text-[#f8edd2]">
      <header className="sticky top-0 z-50 border-b border-[#6f592d]/18 bg-[rgba(8,8,8,0.92)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/community" className="flex items-center gap-2.5">
            <span className="text-lg font-bold tracking-tight text-[#f0d289]">Tradex</span>
            <span className="rounded-full border border-[#6f592d]/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#b99652]">
              Community
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {session?.user ? (
              <>
                <Link
                  href="/community/new"
                  className="rounded-xl bg-[linear-gradient(90deg,#8b6122,#d5aa5e,#f0d289)] px-4 py-1.5 text-xs font-semibold text-[#140d05] shadow-[0_8px_20px_rgba(169,124,40,0.22)] transition hover:brightness-110"
                >
                  + Share trade
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-[#6f592d]/30 px-3 py-1.5 text-xs text-[#b99652] transition hover:border-[#9f7c3a]/55 hover:text-[#fff0c7]"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-xl bg-[linear-gradient(90deg,#8b6122,#d5aa5e,#f0d289)] px-4 py-1.5 text-xs font-semibold text-[#140d05] shadow-[0_8px_20px_rgba(169,124,40,0.22)] transition hover:brightness-110"
              >
                Sign in to post
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}
