'use client'

import { Clock3, Gauge } from 'lucide-react'
import { formatMilitaryTime } from '@/lib/calculator'
import { calculateShift } from '@/lib/shift'
import { usePhilippineClock } from '@/lib/use-philippine-clock'

type Props = {
  totalSeconds: number
  totalUnits: number
  activeWorkloads: number
  activeWorkloadCount: number
  clockInTime: string
  calculatedValues: Array<{ workload: import('@/lib/workloads').Workload; input: string; value: number | null }>
  onClockInChange?: (value: string) => void
}

export function TodaySnapshot({ totalSeconds, totalUnits, clockInTime, onClockInChange }: Props) {
  const { seconds: nowSeconds, time } = usePhilippineClock()
  const shift = calculateShift(clockInTime, totalSeconds, totalUnits, nowSeconds)
  const clockOutText = formatMilitaryTime(shift.estimatedClockOutSeconds)

  const setClockInNow = () => {
    if (onClockInChange) onClockInChange(time)
    else window.dispatchEvent(new CustomEvent('sif:set-clock-in-now', { detail: time }))
  }

  return (
    <section id="dashboard" aria-labelledby="shift-heading" className="scroll-mt-20">
      <div className="mb-5">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">02 / Shift</p>
        <h2 id="shift-heading" className="mt-1 text-xl font-semibold tracking-tight">Live shift</h2>
        <p className="mt-1 text-[9px] leading-4 text-muted-foreground">Your estimated clock-out updates with the workload above.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_10px_32px_var(--card-shadow)] sm:p-6">
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Gauge className="size-4" />
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Clock In</p>
                <p className="mt-0.5 text-[9px] font-semibold text-muted-foreground">Tap the time to edit</p>
              </div>
            </div>
            <button type="button" className="mt-3 block w-full text-left font-mono text-3xl font-bold tracking-[-0.04em] tabular-nums" aria-label={`Edit Clock In time, currently ${clockInTime}`} suppressHydrationWarning title="Edit Clock In time" onClick={() => window.dispatchEvent(new Event('sif:edit-clock-in'))}>{clockInTime || 'Choose time'}</button>
          </div>

          <div className="border-t border-border pt-5">
            <div className="flex items-center gap-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Clock3 className="size-4" />
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Clock Out</p>
                <p className="mt-0.5 text-[9px] font-semibold text-muted-foreground">Estimated finish time</p>
              </div>
            </div>
            <strong className="mt-3 block font-mono text-3xl font-bold tracking-[-0.04em] tabular-nums">{clockOutText}</strong>
          </div>

          <button type="button" onClick={setClockInNow} className="inline-flex w-full items-center justify-center rounded-full bg-primary px-3.5 py-2.5 text-[9px] font-bold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Set Clock In to current PHT time ${time}`}>
            NOW · {time}
          </button>
        </div>
      </div>
    </section>
  )
}
