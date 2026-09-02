'use client'

import { useEffect, useState } from 'react'
import { TimerReset, X } from 'lucide-react'

const STORAGE_KEY = 'sif-tracker-welcome-seen-v1'

export function WelcomePopup() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) !== '1') {
        setOpen(true)
      }
    } catch {
      setOpen(true)
    }
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
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-popup-title"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) dismiss()
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <TimerReset className="size-4" />
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Welcome</p>
              <h2 id="welcome-popup-title" className="mt-1 text-lg font-bold tracking-tight">SIF Tracker</h2>
              <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">
                Track your workload, estimate total work time, and see your expected Clock Out time instantly.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Close welcome popup"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-background/60 px-3.5 py-3 text-[9px] leading-4 text-muted-foreground">
          Enter a quantity or expression such as <span className="font-mono font-semibold text-foreground">5+5</span>, <span className="font-mono font-semibold text-foreground">10*3</span>, or <span className="font-mono font-semibold text-foreground">(5+5)*2</span>.
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="mt-4 w-full rounded-xl bg-primary px-4 py-2.5 text-[10px] font-bold text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          Get started
        </button>
      </div>
    </div>
  )
}
