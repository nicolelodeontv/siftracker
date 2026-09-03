'use client'

import { X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ResetDialog({ open, onClose, onConfirm }: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-title"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose()
      }}
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Confirm reset</p>
            <h3 id="reset-title" className="mt-1 text-sm font-semibold">Reset today’s workload?</h3>
            <p className="mt-1.5 text-[10px] leading-4 text-muted-foreground">This clears all workload inputs and resets Clock In to the current PHT time. Your saved rates stay unchanged.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close reset confirmation"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-[10px] font-bold transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Cancel</button>
          <button type="button" onClick={onConfirm} className="flex-1 rounded-md bg-primary px-3 py-2 text-[10px] font-bold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Reset</button>
        </div>
      </div>
    </div>
  )
}
