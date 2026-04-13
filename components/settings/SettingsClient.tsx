'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Workspace = { id: string; name: string; icon: string | null }
type User = { id: string; name?: string | null; email?: string | null; image?: string | null }

export default function SettingsClient({ workspace, user }: { workspace: Workspace; user: User }) {
  const [wsName, setWsName] = useState(workspace.name)
  const [wsIcon, setWsIcon] = useState(workspace.icon ?? '\ud83c\udfe0')
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  const save = async () => {
    await fetch(`/api/workspaces/${workspace.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: wsName, icon: wsIcon }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  const inputClasses =
    'h-12 rounded-[1rem] border border-[#6f592d] bg-[#050505] px-4 text-sm text-[#f6f2e8] outline-none transition placeholder:text-[#b59e6d]/40 focus:border-[#d9b15c] focus:bg-[#090909] focus:shadow-[0_0_0_3px_rgba(196,149,58,0.12)]'

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8 sm:py-14">
      <div className="rounded-[2rem] border border-[#7e6330]/22 bg-[linear-gradient(180deg,rgba(16,16,16,0.96),rgba(8,8,8,0.94))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur md:p-8 lg:p-10">
        <p className="text-xs uppercase tracking-[0.34em] text-[#cfb16e]/56">AlphaLedger Access</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#fff2d0]">Settings</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#d5c6a3]/56">
          Manage your profile and workspace identity with the same visual language as the login flow.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="rounded-[1.8rem] border border-[#7e6330]/20 bg-[linear-gradient(180deg,rgba(16,16,16,0.95),rgba(8,8,8,0.96))] p-6 shadow-[0_25px_70px_rgba(0,0,0,0.34)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[#cfb16e]/54">Profile</p>
          <div className="mt-5 flex items-center gap-4">
            {user.image ? (
              <Image src={user.image} alt="" width={64} height={64} className="h-16 w-16 rounded-full border border-[#7e6330]/20 object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#7e6330]/20 bg-[linear-gradient(180deg,rgba(34,34,34,0.96),rgba(10,10,10,0.98))] text-2xl text-[#f0d289]">
                {user.name?.[0] ?? '?'}
              </div>
            )}
            <div>
              <p className="text-lg font-medium text-[#fff0c7]">{user.name ?? 'Unknown'}</p>
              <p className="mt-1 text-sm text-[#a48a58]">{user.email}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-[#7e6330]/20 bg-[linear-gradient(180deg,rgba(16,16,16,0.95),rgba(8,8,8,0.96))] p-6 shadow-[0_25px_70px_rgba(0,0,0,0.34)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[#cfb16e]/54">Workspace</p>
          <div className="mt-5 space-y-5">
            <div className="space-y-2">
              <label className="text-sm text-[#f0ddb0]">Workspace icon</label>
              <input
                value={wsIcon}
                onChange={(e) => setWsIcon(e.target.value)}
                className={`${inputClasses} w-28`}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#f0ddb0]">Workspace name</label>
              <input
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                className={`${inputClasses} w-full`}
              />
            </div>
            <button
              onClick={save}
              className="inline-flex h-12 items-center justify-center rounded-[1rem] bg-[linear-gradient(90deg,#8b6122,#d5aa5e,#f0d289)] px-5 text-sm font-semibold text-[#140d05] shadow-[0_14px_30px_rgba(169,124,40,0.22)] transition hover:brightness-110"
            >
              {saved ? '\u2713 Saved' : 'Save changes'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
