'use client'

import { Eraser, Settings2 } from 'lucide-react'
import { WorkloadCard } from '@/components/workload-card'
import { WorkloadSettings } from '@/components/workload-settings'
import type { Workload } from '@/lib/workloads'

type CalculatedValue = { workload: Workload; input: string }

type Props = {
  calculatedValues: CalculatedValue[]
  workloads: Workload[]
  rates: Record<string, number>
  savedRates: Record<string, number>
  settingsOpen: boolean
  unsavedRates: boolean
  editingRate: string | null
  rateDraft: string
  inputRefs: React.MutableRefObject<Array<HTMLInputElement | null>>
  totalSeconds: number
  totalUnits: number
  onClearAll: () => void
  onToggleSettings: () => void
  onAdjust: (id: string, delta: number) => void
  onChange: (id: string, value: string) => void
  onClear: (id: string) => void
  onSummaryShortcut: () => void
  onAdjustRate: (id: string, delta: number) => void
  onBeginEdit: (id: string) => void
  onDraftChange: (value: string) => void
  onCommitEdit: (id: string) => void
  onCancelEdit: () => void
  onResetRates: () => void
  onSaveRates: () => void
  onCloseSettings: () => void
}

const cardClass = 'rounded-xl border border-border bg-card/85 shadow-[0_8px_28px_var(--card-shadow)] backdrop-blur'

export function CalculatorSection({
  calculatedValues,
  workloads,
  rates,
  savedRates,
  settingsOpen,
  unsavedRates,
  editingRate,
  rateDraft,
  inputRefs,
  totalSeconds,
  totalUnits,
  onClearAll,
  onToggleSettings,
  onAdjust,
  onChange,
  onClear,
  onSummaryShortcut,
  onAdjustRate,
  onBeginEdit,
  onDraftChange,
  onCommitEdit,
  onCancelEdit,
  onResetRates,
  onSaveRates,
  onCloseSettings,
}: Props) {
  return (
    <section id="calculator">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">01 / Calculator</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">Enter your workload</h2>
          <p className="mt-1 text-[8px] font-medium leading-4 text-muted-foreground/70">⌨ Enter → next · ↑ ↓ adjust · Ctrl/Cmd+Enter → summary</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:shrink-0">
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 text-[10px] font-semibold shadow-sm transition hover:border-primary/30 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Clear all workload inputs"
          >
            <Eraser className="size-3" aria-hidden="true" />
            Clear all
          </button>
          <button
            type="button"
            onClick={onToggleSettings}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-[10px] font-semibold shadow-sm transition hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={settingsOpen}
            aria-controls="settings"
          >
            <Settings2 className="size-3" aria-hidden="true" />
            Settings
            {unsavedRates && <span className="size-1.5 rounded-full bg-primary" aria-label="Unsaved changes" />}
          </button>
        </div>
      </div>

      {settingsOpen && (
        <WorkloadSettings
          workloads={workloads}
          rates={rates}
          savedRates={savedRates}
          editingRate={editingRate}
          rateDraft={rateDraft}
          onAdjust={onAdjustRate}
          onBeginEdit={onBeginEdit}
          onDraftChange={onDraftChange}
          onCommitEdit={onCommitEdit}
          onCancelEdit={onCancelEdit}
          onReset={onResetRates}
          onSave={onSaveRates}
          onClose={onCloseSettings}
        />
      )}

      <div className="grid min-w-0 gap-2.5 lg:grid-cols-2">
        {calculatedValues.map(({ workload, input }, index) => (
          <WorkloadCard
            key={workload.id}
            workload={workload}
            input={input}
            inputRef={(element) => {
              inputRefs.current[index] = element
            }}
            onChange={(nextValue) => onChange(workload.id, nextValue)}
            onAdjust={(delta) => onAdjust(workload.id, delta)}
            onClear={() => onClear(workload.id)}
            onNext={() => inputRefs.current[index + 1]?.focus()}
            onSummaryShortcut={onSummaryShortcut}
          />
        ))}

        <section id="workflow" className={`${cardClass} rounded-xl border-primary/40 bg-card p-4 shadow-[0_12px_36px_var(--card-shadow)]`}>
          <div className="flex h-full flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <p className="text-[8px] font-bold uppercase tracking-[0.18em] opacity-70">02 / Workflow</p>
              <h3 className="mt-1 text-base font-semibold tracking-tight">One total, all workloads.</h3>
              <p className="mt-1 text-[10px] leading-4 opacity-75">{totalUnits} total units across {workloads.length} workload types.</p>
            </div>
            <div className="min-w-0 text-left sm:text-right">
              <span className="block text-[8px] font-bold uppercase tracking-[0.16em] opacity-60">Total work time</span>
              <strong aria-live="polite" className="mt-0.5 block whitespace-nowrap font-mono text-2xl font-bold tracking-[-0.04em] tabular-nums sm:text-3xl">{formatDuration(totalSeconds)}</strong>
            </div>
          </div>
        </section>
      </div>
    </section>
  )
}

import { formatDuration } from '@/lib/calculator'
