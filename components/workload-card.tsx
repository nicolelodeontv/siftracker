'use client'

import type { RefCallback } from 'react'
import { X } from 'lucide-react'
import { calculateValue, formatCompactDuration, formatDuration, isIncompleteExpression } from '@/lib/calculator'
import type { Workload } from '@/lib/workloads'
import { getExampleAmounts, getUnitLabel } from '@/lib/workloads'

type Props = {
  workload: Workload
  input: string
  totalSeconds: number
  inputRef: RefCallback<HTMLInputElement>
  onChange: (value: string) => void
  onAdjust: (delta: number) => void
  onClear: () => void
  onNext: () => void
  onSummaryShortcut: () => void
}

export function WorkloadCard({ workload, input, totalSeconds, inputRef, onChange, onClear, onNext, onSummaryShortcut }: Props) {
  const hasInput = input.trim() !== ''
  const value = calculateValue(input)
  const incomplete = hasInput && isIncompleteExpression(input)
  const invalid = hasInput && value === null && !incomplete
  const safeValue = Math.max(0, value ?? 0)
  const duration = safeValue * workload.minutesPerUnit * 60
  const share = totalSeconds > 0 && value !== null ? Math.min(100, Math.round((duration / totalSeconds) * 100)) : 0

  return (
    <article data-workload-id={workload.id} data-workload-label={workload.label} data-duration-seconds={duration} className="workload-card rounded-xl border border-border bg-card/85 p-3.5 shadow-[0_8px_28px_var(--card-shadow)] backdrop-blur transition hover:border-primary/25">
      <div className="workload-card__header relative flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ backgroundColor: workload.accent }} aria-hidden="true" />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold tracking-tight">{workload.label}</h3>
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{workload.minutesPerUnit} minutes per {workload.unit.slice(0, -1)}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <output className="font-mono text-[15px] font-bold tabular-nums" style={{ color: workload.accent }} aria-label={`${workload.label} calculated time`}>
            {formatDuration(duration)}
          </output>
          {hasInput && (
            <button type="button" onClick={onClear} className="rounded-md p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Clear ${workload.label}`} title="Clear">
              <X className="size-3" />
            </button>
          )}
        </div>
        <div className="absolute inset-x-0 -bottom-2 h-1 overflow-hidden rounded-full bg-muted/70" aria-hidden="true">
          <div className="h-full rounded-full bg-primary/65 transition-[width] duration-300" style={{ width: `${share}%` }} />
        </div>
      </div>

      <div className="workload-card__body">
        <label htmlFor={`workload-${workload.id}`} className="workload-card__label">Number of {workload.unit}</label>
        <div className="workload-card__input-row">
          <div className="relative min-w-0 flex-1">
            <input
              ref={inputRef}
              id={`workload-${workload.id}`}
              type="text"
              inputMode="text"
              autoComplete="off"
              value={input}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault()
                  onClear()
                  return
                }
                if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                  event.preventDefault()
                  onSummaryShortcut()
                  return
                }
                if (event.key === 'Enter') {
                  event.preventDefault()
                  onNext()
                }
              }}
              className={`workload-card__input h-11 w-full rounded-lg border bg-input-background px-3 pr-16 font-mono text-[15px] font-medium tabular-nums text-foreground outline-none transition ${invalid ? 'border-destructive focus:ring-4 focus:ring-destructive/10' : 'border-input focus:border-primary focus:ring-4 focus:ring-primary/10'}`}
              aria-invalid={invalid}
              aria-describedby={`feedback-${workload.id}`}
              aria-label={`Number of ${workload.unit} for ${workload.label}`}
            />
            {value !== null && hasInput && (
              <output className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-[15px] font-semibold tabular-nums text-muted-foreground opacity-60" aria-hidden="true">{value}</output>
            )}
          </div>
        </div>

        <div id={`feedback-${workload.id}`} className="workload-card__feedback" aria-live="polite">
          {invalid ? (
            <p className="text-[9px] font-medium text-destructive">Invalid expression</p>
          ) : incomplete ? (
            <p className="text-[9px] font-medium text-muted-foreground">Waiting for expression…</p>
          ) : hasInput ? (
            <p className="rounded-md bg-background/40 px-2.5 py-1.5 font-mono text-[9px] font-semibold text-muted-foreground">{input} = {value} {getUnitLabel(workload.unit, value ?? 0)} → {formatDuration(duration)}</p>
          ) : (
            <p className="text-[9px] leading-4 text-muted-foreground/70">Enter a quantity or expression: 5+5 · 10*3 · (5+5)*2</p>
          )}
        </div>
      </div>

      <div className="workload-card__examples mt-3 border-t border-border pt-3">
        {getExampleAmounts(workload).map((amount) => <span key={amount} className="font-mono text-[8px] font-semibold leading-3.5 tracking-tight text-muted-foreground">{getUnitLabel(workload.unit, amount)} = {formatCompactDuration(amount * workload.minutesPerUnit)}</span>)}
      </div>
    </article>
  )
}
