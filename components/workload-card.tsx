import type { RefObject } from 'react'
import { Minus, Plus, X } from 'lucide-react'
import { calculateValue, formatDuration, isIncompleteExpression } from '@/lib/calculator'
import type { Workload } from '@/lib/workloads'

type CalculatedValue = {
  workload: Workload
  input: string
  value: number | null
}

type Props = {
  calculatedValues: CalculatedValue[]
  totalSeconds: number
  inputRefs: RefObject<Array<HTMLInputElement | null>>
  onChange: (id: string, value: string) => void
  onAdjust: (id: string, delta: number) => void
  onClear: (id: string) => void
  onNext: (index: number) => void
}

export function WorkloadCard({ calculatedValues, totalSeconds, inputRefs, onChange, onAdjust, onClear, onNext }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/60" role="table" aria-label="Today's workload">
      <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(10rem,1.2fr)_6.5rem] items-center gap-4 border-b border-border px-4 py-2.5 text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:grid" role="row">
        <span role="columnheader">Workload</span>
        <span className="text-center" role="columnheader">Quantity</span>
        <span className="text-right" role="columnheader">Work time</span>
      </div>

      {calculatedValues.map(({ workload, input }, index) => {
        const hasInput = input.trim() !== ''
        const value = calculateValue(input)
        const incomplete = hasInput && isIncompleteExpression(input)
        const invalid = hasInput && value === null && !incomplete
        const safeValue = Math.max(0, value ?? 0)
        const duration = safeValue * workload.minutesPerUnit * 60
        const share = totalSeconds > 0 && value !== null ? Math.min(100, Math.round((duration / totalSeconds) * 100)) : 0

        return (
          <div
            key={workload.id}
            data-workload-id={workload.id}
            data-workload-label={workload.label}
            data-duration-seconds={duration}
            className="grid gap-3 border-b border-border px-4 py-2 last:border-b-0 sm:grid-cols-[minmax(0,1.2fr)_minmax(10rem,1.2fr)_6.5rem] sm:items-center sm:gap-4"
            role="row"
          >
            <div className="min-w-0" role="cell">
              <div className="flex items-baseline justify-between gap-3 sm:justify-start">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold tracking-tight">{workload.label}</h3>
                  <p className="mt-0.5 text-[9px] text-muted-foreground">{workload.minutesPerUnit} min / {workload.unit.slice(0, -1)}</p>
                </div>
                <span className="shrink-0 font-mono text-[10px] font-semibold text-muted-foreground sm:hidden">{formatDuration(duration)}</span>
              </div>
              <div className="mt-1.5 min-h-4" aria-live="polite">
                {invalid ? (
                  <p className="text-[9px] font-medium text-muted-foreground">Invalid expression</p>
                ) : incomplete ? (
                  <p className="text-[9px] font-medium text-muted-foreground">Waiting for expression…</p>
                ) : hasInput ? (
                  null
                ) : (
                  <p className="text-[9px] leading-4 text-muted-foreground/70">5+5 · 10*3 · (5+5)*2</p>
                )}
              </div>
            </div>

            <div className="w-full min-w-0" role="cell">
              <label htmlFor={`workload-${workload.id}`} className="sr-only">Number of {workload.unit} for {workload.label}</label>
              <div className="flex min-w-0 items-center justify-center gap-1.5">
                <button type="button" onClick={() => onAdjust(workload.id, -1)} className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Decrease ${workload.label} quantity`}>
                  <Minus className="size-3.5" />
                </button>
                <div className="relative min-w-0">
                  <input
                    ref={(element) => { inputRefs.current[index] = element }}
                    id={`workload-${workload.id}`}
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    value={input}
                    onChange={(event) => onChange(workload.id, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        event.preventDefault()
                        onClear(workload.id)
                        return
                      }
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        onNext(index)
                        return
                      }
                      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                        event.preventDefault()
                        onAdjust(workload.id, event.key === 'ArrowUp' ? 1 : -1)
                      }
                    }}
                    className={`h-10 w-32 shrink-0 rounded-xl border bg-input-background px-3 font-mono text-base font-medium tabular-nums text-foreground outline-none transition-colors sm:w-80 ${invalid ? 'border-border focus:ring-4 focus:ring-primary/10' : 'border-input focus:border-primary focus:ring-4 focus:ring-primary/10'}`}
                    aria-invalid={invalid}
                    aria-label={`Number of ${workload.unit} for ${workload.label}`}
                  />
                </div>
                <button type="button" onClick={() => onAdjust(workload.id, 1)} className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Increase ${workload.label} quantity`}>
                  <Plus className="size-3.5" />
                </button>
                <button type="button" onClick={() => onClear(workload.id)} className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${hasInput ? '' : 'invisible pointer-events-none'}`} aria-label={`Clear ${workload.label}`} aria-hidden={!hasInput} tabIndex={hasInput ? 0 : -1} title="Clear">
                  <X className="size-3.5" />
                </button>
              </div>
            </div>

            <div className="hidden text-right sm:block" role="cell">
              <output className="font-mono text-sm font-bold tabular-nums">{formatDuration(duration)}</output>
              <div className="mt-1.5 ml-auto h-1 w-16 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${share}%` }} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
