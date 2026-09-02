'use client'

import { Minus, Plus, RotateCcw, X } from 'lucide-react'
import { formatCompactDuration } from '@/lib/calculator'
import type { Workload } from '@/lib/workloads'
import { DEFAULT_RATES, getExampleAmounts } from '@/lib/workloads'

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
    <section id="settings" className="mb-3 rounded-xl border border-border bg-card/85 p-3.5 shadow-[0_8px_28px_var(--card-shadow)] backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Settings</p>
          <h3 className="mt-1 text-sm font-semibold">Workload rates</h3>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Close settings">
          <X className="size-3.5" />
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {workloads.map((workload) => (
          <div key={workload.id} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border bg-background/60 px-3 py-2.5">
            <div className="min-w-0">
              <span className="block truncate text-[10px] font-semibold">{workload.label}</span>
              <span className="text-[8px] text-muted-foreground">Minutes per {workload.unit.slice(0, -1)}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button type="button" onClick={() => onAdjust(workload.id, -1)} className="flex size-8 items-center justify-center rounded-md border border-border bg-card transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Decrease ${workload.label}`}>
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
                  className="h-8 w-14 rounded-md border border-input bg-background px-1 text-center font-mono text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  aria-label={`Edit ${workload.label} rate`}
                />
              ) : (
                <button type="button" onClick={() => onBeginEdit(workload.id)} className="w-12 rounded-md py-1 text-center font-mono text-sm font-bold transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Edit ${workload.label} rate`}>
                  {workload.minutesPerUnit}m
                </button>
              )}
              <button type="button" onClick={() => onAdjust(workload.id, 1)} className="flex size-8 items-center justify-center rounded-md border border-border bg-card transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Increase ${workload.label}`}>
                <Plus className="size-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-lg bg-background/50 px-3 py-2.5">
        <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Examples</p>
        <div className="mt-1.5 grid gap-1 sm:grid-cols-2">
          {workloads.map((workload) => (
            <div key={workload.id} className="min-w-0 font-mono text-[8px] leading-3.5 text-muted-foreground">
              <span className="font-semibold text-foreground">{workload.label}:</span>{' '}
              {getExampleAmounts(workload).map((amount, index) => (
                <span key={amount}>{index > 0 ? ' · ' : ''}{amount} = {formatCompactDuration(amount * workload.minutesPerUnit)}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[8px] text-muted-foreground">{unsavedRates ? 'Unsaved changes' : 'Saved rates are active.'}</span>
        <div className="flex gap-2">
          <button type="button" onClick={onReset} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-[9px] font-bold transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <RotateCcw className="size-3" />Reset
          </button>
          <button type="button" onClick={onSave} disabled={!unsavedRates} className="rounded-md bg-primary px-3 py-1.5 text-[9px] font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45">
            Save
          </button>
        </div>
      </div>
    </section>
  )
}
