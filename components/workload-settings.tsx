'use client'

import { Minus, Plus, RotateCcw, X } from 'lucide-react'
import type { Workload } from '@/lib/workloads'

type Props = {
  workloads: Workload[]
  rates: Record<string, number>
  savedRates: Record<string, number>
  editingRate: string | null
  rateDraft: string
  onAdjust: (id: string, delta: number) => void
  onBeginEdit: (id: string) => void
  onDraftChange: (value: string) => void
  onCommitEdit: (id: string) => void
  onCancelEdit: () => void
  onReset: () => void
  onSave: () => void
  onClose: () => void
}

export function WorkloadSettings({ workloads, rates, savedRates, editingRate, rateDraft, onAdjust, onBeginEdit, onDraftChange, onCommitEdit, onCancelEdit, onReset, onSave, onClose }: Props) {
  const unsavedRates = workloads.some(({ id }) => rates[id] !== savedRates[id])

  return (
    <section id="settings" className="rounded-2xl border border-border bg-card/60 px-4 py-4 sm:px-5" aria-label="Workload settings">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Settings</p>
          <h3 className="mt-1 text-sm font-semibold">Workload rates</h3>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Close settings">
          <X className="size-3.5" />
        </button>
      </div>

      <div className="divide-y divide-border border-y border-border">
        {workloads.map((workload) => (
          <div key={workload.id} className="flex min-w-0 items-center justify-between gap-4 py-2">
            <div className="min-w-0">
              <span className="block truncate text-[10px] font-semibold">{workload.label}</span>
              <span className="text-[8px] text-muted-foreground">Minutes per {workload.unit.slice(0, -1)}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button type="button" onClick={() => onAdjust(workload.id, -1)} className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Decrease ${workload.label}`}>
                <Minus className="size-3" />
              </button>
              {editingRate === workload.id ? (
                <input
                  autoFocus
                  value={rateDraft}
                  onChange={(event) => onDraftChange(event.target.value)}
                  onBlur={() => onCommitEdit(workload.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') onCommitEdit(workload.id)
                    if (event.key === 'Escape') onCancelEdit()
                  }}
                  className="h-8 w-14 rounded-lg border border-input bg-background px-1 text-center font-mono text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  aria-label={`Edit ${workload.label} rate`}
                />
              ) : (
                <button type="button" onClick={() => onBeginEdit(workload.id)} className="w-12 rounded-lg py-1 text-center font-mono text-sm font-bold transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Edit ${workload.label} rate`}>
                  {workload.minutesPerUnit}m
                </button>
              )}
              <button type="button" onClick={() => onAdjust(workload.id, 1)} className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Increase ${workload.label}`}>
                <Plus className="size-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[8px] text-muted-foreground">{unsavedRates ? 'Unsaved changes' : 'Saved rates are active.'}</span>
        <div className="flex gap-2">
          <button type="button" onClick={onReset} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[9px] font-bold text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <RotateCcw className="size-3" />Reset
          </button>
          <button type="button" onClick={onSave} disabled={!unsavedRates} className="rounded-full border border-border px-3 py-1.5 text-[9px] font-bold text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45">
            Save
          </button>
        </div>
      </div>
    </section>
  )
}
