import type { RefObject } from 'react'
import { Minus, Plus, X } from 'lucide-react'
import { calculateValue, formatDuration } from '@/lib/calculator'
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
  const totalQuantity = calculatedValues.reduce((total, { value }) => total + Math.max(0, value ?? 0), 0)
  const formattedTotalQuantity = Number.isInteger(totalQuantity) ? String(totalQuantity) : totalQuantity.toFixed(2)

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card/60" role="table" aria-label="Today's workload">
      <div className="hidden grid-cols-[1fr_1.75fr_0.75fr] items-center gap-4 border-b border-border px-4 py-2.5 text-center text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:grid" role="row">
        <span role="columnheader">Workload</span>
        <span className="text-center" role="columnheader">Quantity</span>
        <span role="columnheader">Work time</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {calculatedValues.map(({ workload, input }, index) => {
          const hasInput = input.trim() !== ''
          const value = calculateValue(input)
          const invalid = hasInput && value === null
          const safeValue = Math.max(0, value ?? 0)
          const duration = safeValue * workload.minutesPerUnit * 60
          const share = totalSeconds > 0 && value !== null ? Math.min(100, Math.round((duration / totalSeconds) * 100)) : 0

          return (
            <div
              key={workload.id}
              data-workload-id={workload.id}
              data-workload-label={workload.label}
              data-duration-seconds={duration}
              className="grid flex-[1_1_auto] gap-2 border-b border-border px-4 py-2 text-center last:border-b-0 sm:grid-cols-[1fr_1.75fr_0.75fr] sm:items-center sm:gap-4"
              role="row"
            >
              <div className="min-w-0 self-stretch flex flex-col items-center justify-center" role="cell">
                <div className="flex flex-col items-center justify-center gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                  <div className="min-w-0 text-center">
                    <h3 className="truncate text-sm font-semibold tracking-tight">{workload.label}</h3>
                    <p className="mt-0.5 text-[9px] text-muted-foreground">{workload.minutesPerUnit} min / {workload.unit.slice(0, -1)}</p>
                  </div>
                  <span className={`shrink-0 font-mono text-[10px] font-semibold sm:hidden ${safeValue > 0 ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}>{formatDuration(duration)}</span>
                </div>
              </div>

              <div className="w-full min-w-0" role="cell">
                <label htmlFor={`workload-${workload.id}`} className="sr-only">Number of {workload.unit} for {workload.label}</label>
                <div className="relative mx-auto flex w-full min-w-0 max-w-sm items-center justify-center sm:mx-0 sm:max-w-none sm:justify-start">
                  <div className="flex w-[calc(100%-5.5rem)] min-w-0 items-center gap-1.5 sm:w-full">
                    <button type="button" onClick={() => onAdjust(workload.id, -1)} className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Decrease ${workload.label} quantity`}>
                      <Minus className="size-3.5" />
                    </button>
                    <div className="relative min-w-0 flex-1">
                      <input
                        ref={(element) => { inputRefs.current[index] = element }}
                        id={`workload-${workload.id}`}
                        type="text"
                        inputMode="text"
                        autoComplete="off"
                        placeholder="0"
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
                        className={`h-10 w-full min-w-0 rounded-xl border bg-input-background px-3 font-mono text-base font-medium tabular-nums text-foreground placeholder:text-muted-foreground/35 outline-none transition-colors ${invalid ? 'border-border focus:ring-4 focus:ring-primary/10' : 'border-input focus:border-primary focus:ring-4 focus:ring-primary/10'}`}
                        aria-invalid={invalid}
                        aria-label={`Number of ${workload.unit} for ${workload.label}`}
                      />
                    </div>
                    <button type="button" onClick={() => onAdjust(workload.id, 1)} className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Increase ${workload.label} quantity`}>
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <button type="button" onClick={() => onClear(workload.id)} className={`absolute right-0 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${hasInput ? '' : 'invisible pointer-events-none'}`} aria-label={`Clear ${workload.label}`} aria-hidden={!hasInput} tabIndex={hasInput ? 0 : -1} title="Clear">
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="hidden text-center sm:block" role="cell">
                <output className={`font-mono text-sm font-bold tabular-nums ${safeValue > 0 ? 'text-foreground' : 'text-muted-foreground/40'}`}>{formatDuration(duration)}</output>
                <div className="mx-auto mt-1.5 h-1 w-16 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${share}%` }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div
        className="grid grid-cols-[1fr_1.75fr_0.75fr] items-center gap-2 border-t border-border bg-background/35 px-4 py-2.5 text-center sm:gap-4"
        role="row"
        aria-label="Workload totals"
      >
        <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-foreground" role="rowheader">
          Total
        </span>
        <div className="font-mono text-[10px] font-bold tabular-nums text-foreground" role="cell">
          {formattedTotalQuantity}
          <span className="ml-1 text-[8px] font-semibold text-muted-foreground">qty</span>
        </div>
        <output className="font-mono text-[10px] font-bold tabular-nums text-foreground sm:text-sm" role="cell">
          {formatDuration(totalSeconds)}
        </output>
      </div>
    </div>
  )
}
