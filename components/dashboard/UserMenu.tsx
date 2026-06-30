'use client'

import { useRef, useState } from 'react'
import { ChevronDown, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/providers/AuthProvider'

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const { user, signOut } = useAuth()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  const rawName = user?.email?.split('@')[0] ?? 'myboss'
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1)
  const displayEmail = user?.email ?? 'Administrator'
  const initials = rawName.slice(0, 2).toUpperCase()

  async function handleSignOut() {
    setOpen(false)
    await signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-black/8 bg-white pl-1.5 pr-3 py-1.5 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.18)] transition-all duration-150 hover:border-black/12 hover:bg-slate-50 active:scale-[0.98]"
        aria-label="User menu"
        aria-expanded={open}
      >
        <div className="flex size-8 items-center justify-center rounded-full bg-slate-950 text-[11px] font-semibold text-white ring-2 ring-white">
          {initials}
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-sm font-medium leading-tight text-slate-950">{displayName}</p>
          <p className="text-[11px] leading-tight text-slate-400">{displayEmail}</p>
        </div>
        <ChevronDown
          className={[
            'size-3.5 text-slate-400 transition-transform duration-150',
            open ? 'rotate-180' : '',
          ].join(' ')}
        />
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            tabIndex={-1}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-[1.25rem] border border-black/8 bg-white p-1.5 shadow-[0_20px_56px_-30px_rgba(15,23,42,0.28)]">
            <div className="border-b border-black/6 px-3 pb-3 pt-2">
              <p className="text-xs font-medium text-slate-950">{displayName}</p>
              <p className="mt-0.5 truncate text-[11px] text-slate-400">{displayEmail}</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-1.5 flex w-full items-center gap-2.5 rounded-[0.875rem] px-3 py-2.5 text-left text-sm text-slate-600 transition-colors duration-100 hover:bg-slate-50 hover:text-slate-950"
            >
              <LogOut className="size-3.5 text-slate-400" />
              Sign out
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
