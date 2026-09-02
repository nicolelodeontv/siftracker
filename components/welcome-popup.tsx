'use client'

import { useEffect, useState } from 'react'
import { Calculator, Clock3, TimerReset, X } from 'lucide-react'

const STORAGE_KEY = 'sif-tracker-welcome-seen-v2'

export function WelcomePopup() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) !== '1') setOpen(true)
    } catch {
      setOpen(true)
    }

    const reopen = () => setOpen(true)
    window.addEventListener('sif:open-welcome', reopen)
    return () => window.removeEventListener('sif:open-welcome', reopen)
  }, [])

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // Ignore unavailable local storage.
    }
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-3 backdrop-blur-[3px] sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-popup-title"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) dismiss()
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <TimerReset className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Quick start</p>
                <h2 id="welcome-popup-title" className="mt-1 text-lg font-bold tracking-tight sm:text-xl">Welcome to SIF Tracker 👋</h2>
                <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">Your quick production-time calculator.</p>
              </div>
            </div>
            <button type="button" onClick={dismiss} className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground" aria-label="Close welcome popup"><X className="size-4" /></button>
          </div>

          <div className="mt-5 grid gap-2.5">
            <div className="flex items-start gap-3 rounded-xl border border-border bg-background/60 p-3.5"><div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Calculator className="size-3.5" /></div><div className="min-w-0"><p className="text-[10px] font-bold">① Enter workloads</p><p className="mt-1 text-[9px] leading-4 text-muted-foreground">Add quantities using numbers or expressions like <span className="font-mono font-semibold text-foreground">5+5</span> or <span className="font-mono font-semibold text-foreground">10*3</span>.</p></div></div>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-background/60 p-3.5"><div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Clock3 className="size-3.5" /></div><div className="min-w-0"><p className="text-[10px] font-bold">② Set your Clock In</p><p className="mt-1 text-[9px] leading-4 text-muted-foreground">Choose your start time and SIF Tracker calculates your expected Clock Out.</p></div></div>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-background/60 p-3.5"><div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><TimerReset className="size-3.5" /></div><div className="min-w-0"><p className="text-[10px] font-bold">③ Track your shift</p><p className="mt-1 text-[9px] leading-4 text-muted-foreground">See total work time, break time, and time remaining at a glance.</p></div></div>
          </div>

          <div className="mt-4 rounded-xl border border-primary/15 bg-primary/5 px-3.5 py-3"><p className="text-[8px] font-bold uppercase tracking-[0.16em] text-primary">💡 Tip</p><p className="mt-1 text-[9px] leading-4 text-muted-foreground">Your workload rates are saved, so you only need to configure them once.</p></div>

          <div className="mt-5 flex items-center justify-between gap-3"><span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Quick start · 1 of 1</span><button type="button" onClick={dismiss} className="rounded-xl bg-primary px-5 py-2.5 text-[10px] font-bold text-primary-foreground shadow-sm transition hover:opacity-90">Get started</button></div>
        </div>
      </div>
    </div>
  )
}
