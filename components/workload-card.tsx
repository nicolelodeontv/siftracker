'use client'

import type { RefCallback } from 'react'
import { TimerReset, X, Minus, Plus } from 'lucide-react'
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

export function WorkloadCard({ workload, input, totalSeconds, inputRef, onChange, onAdjust, onClear, onNext, onSummaryShortcut }: Props) {
  const hasInput = input.trim() !== ''
  const value = calculateValue(input)
  const incomplete = hasInput && isIncompleteExpression(input)
  const invalid = hasInput && value === null && !incomplete
  const safeValue = Math.max(0, value ?? 0)
  const duration = safeValue * workload.minutesPerUnit * 60
  const share = totalSeconds > 0 && value !== null ? Math.min(100, Math.round((duration / totalSeconds) * 100)) : 0
  const unitLabel = workload.unit.slice(0, -1)

  return (
    <>
      <article data-workload-id={workload.id} data-workload-label={workload.label} data-duration-seconds={duration} className="workload-card rounded-2xl border border-border bg-card/90 p-3.5 shadow-[0_10px_30px_var(--card-shadow)] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_14px_36px_var(--card-shadow)]">
        <div className="workload-card__header relative flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="mt-1 size-2.5 shrink-0 rounded-full ring-4" style={{ backgroundColor: workload.accent, boxShadow: `0 0 0 4px color-mix(in srgb, ${workload.accent} 10%, transparent)` }} aria-hidden="true" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-semibold tracking-tight">{workload.label}</h3>
                <span className="hidden rounded-full border px-1.5 py-0.5 text-[6px] font-bold uppercase tracking-[0.14em] sm:inline-flex" style={{ borderColor: `color-mix(in srgb, ${workload.accent} 25%, var(--border))`, color: workload.accent }}>
                  {hasInput ? 'Active' : 'Ready'}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[9px] text-muted-foreground">{workload.minutesPerUnit} min / {unitLabel}</p>
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
          <div className="absolute inset-x-0 -bottom-2 h-1 overflow-hidden rounded-full bg-muted/80" aria-hidden="true">
            <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${share}%`, backgroundColor: workload.accent }} />
          </div>
        </div>

        <div className="workload-card__body">
          <label htmlFor={`workload-${workload.id}`} className="workload-card__label">Number of {workload.unit}</label>
          <div className="workload-card__input-row">
            <button type="button" onClick={() => onAdjust(-1)} className="workload-card__quantity-button inline-flex !w-9 !shrink-0 !items-center !justify-center !p-0" style={{ borderColor: `color-mix(in srgb, ${workload.accent} 25%, var(--border))` }} aria-label={`Decrease ${workload.label} quantity`}>
              <Minus className="size-3.5" />
            </button>
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
                    return
                  }
                  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                    event.preventDefault()
                    onAdjust(event.key === 'ArrowUp' ? 1 : -1)
                  }
                }}
                className={`workload-card__input h-11 w-full rounded-xl border bg-input-background px-3 pr-16 font-mono text-[15px] font-medium tabular-nums text-foreground outline-none transition ${invalid ? 'border-destructive focus:ring-4 focus:ring-destructive/10' : 'border-input focus:border-primary focus:ring-4 focus:ring-primary/10'}`}
                aria-invalid={invalid}
                aria-describedby={`feedback-${workload.id}`}
                aria-label={`Number of ${workload.unit} for ${workload.label}`}
                style={{ caretColor: workload.accent }}
              />
              {value !== null && hasInput && (
                <output className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-[15px] font-semibold tabular-nums text-muted-foreground opacity-60" aria-hidden="true">{value}</output>
              )}
            </div>
            <button type="button" onClick={() => onAdjust(1)} className="workload-card__quantity-button inline-flex !w-9 !shrink-0 !items-center !justify-center !p-0" style={{ borderColor: `color-mix(in srgb, ${workload.accent} 25%, var(--border))` }} aria-label={`Increase ${workload.label} quantity`}>
              <Plus className="size-3.5" />
            </button>
          </div>

          <div id={`feedback-${workload.id}`} className="workload-card__feedback" aria-live="polite">
            {invalid ? (
              <p className="text-[9px] font-medium text-destructive">Invalid expression</p>
            ) : incomplete ? (
              <p className="text-[9px] font-medium text-muted-foreground">Waiting for expression…</p>
            ) : hasInput ? (
              <p className="rounded-lg bg-background/50 px-2.5 py-1.5 font-mono text-[9px] font-semibold text-muted-foreground">{input} = {value} {getUnitLabel(workload.unit, value ?? 0)} → {formatDuration(duration)}</p>
            ) : (
              <p className="text-[9px] leading-4 text-muted-foreground/70">Quantity or expression: 5+5 · 10*3 · (5+5)*2</p>
            )}
          </div>
        </div>

        <div className="workload-card__examples mt-3 border-t border-border pt-3">
          {getExampleAmounts(workload).map((amount) => <span key={amount} className="font-mono text-[8px] font-semibold leading-3.5 tracking-tight text-muted-foreground">{getUnitLabel(workload.unit, amount)} = {formatCompactDuration(amount * workload.minutesPerUnit)}</span>)}
        </div>
      </article>

      {workload.id === 'lateOrders' && (
        <>
          <section className="workload-total-card h-[220px] min-h-[220px] w-full min-w-0 overflow-hidden rounded-2xl border border-primary/25 bg-card/90 p-3.5 shadow-[0_10px_30px_var(--card-shadow)] backdrop-blur sm:p-4">
            <div className="flex h-full min-h-0 flex-col justify-center gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <TimerReset className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">02 / Summary</p>
                  <h3 className="mt-0.5 text-base font-semibold tracking-tight">One total, all workloads.</h3>
                </div>
              </div>
              <p className="text-[10px] leading-4 text-muted-foreground">Combined calculated workload time across all workload cards.</p>
              <div className="rounded-xl border border-border bg-background/45 px-4 py-3">
                <span className="block text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Total work time</span>
                <strong aria-live="polite" className="mt-1 block whitespace-nowrap font-mono text-2xl font-bold tracking-[-0.04em] tabular-nums sm:text-3xl">{formatDuration(totalSeconds)}</strong>
              </div>
            </div>
          </section>
          <style jsx global>{`
            #calculator + #workflow {
              display: none !important;
            }
          `}</style>
        </>
      )}
    </>
  )
}