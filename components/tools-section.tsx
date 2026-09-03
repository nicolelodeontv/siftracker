'use client'

import { RotateCcw } from 'lucide-react'

export function ToolsSection({ onReset }: { onReset: () => void }) {
  return (
    <section id="tools" className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-card/50 p-3.5 shadow-[0_8px_28px_var(--card-shadow)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">04 / Tools</p>
        <p className="mt-1 text-[10px] leading-4 text-muted-foreground">Reset today’s workload without changing your saved rates.</p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full border border-border bg-background/70 px-3 text-[10px] font-semibold transition hover:border-primary/30 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
      >
        <RotateCcw className="size-3" aria-hidden="true" />
        Reset today’s workload
      </button>
    </section>
  )
}
