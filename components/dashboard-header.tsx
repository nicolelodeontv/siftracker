'use client'

import { HelpCircle, TimerReset } from 'lucide-react'
import { PhtClockDisplay } from '@/components/pht-clock-display'
import { ThemeToggle } from '@/components/theme-toggle'

type Props = {
  onOpenQuickGuide: () => void
}

export function DashboardHeader({ onOpenQuickGuide }: Props) {
  return (
    <nav className="flex min-h-14 items-center justify-between gap-3 border-b border-border/70 sm:gap-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <TimerReset className="size-3.5" />
        </div>
        <span className="truncate text-sm font-bold tracking-tight">SIF Tracker</span>
      </div>

      <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
        <PhtClockDisplay />
        <button
          type="button"
          onClick={onOpenQuickGuide}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 text-[9px] font-bold shadow-sm transition hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-10"
          aria-label="Open Quick Guide"
        >
          <HelpCircle className="size-3" aria-hidden="true" />
          <span className="hidden sm:inline">Quick Guide</span>
        </button>
        <ThemeToggle />
      </div>
    </nav>
  )
}
