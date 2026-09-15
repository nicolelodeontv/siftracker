'use client'

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

const CARD_CLASS = 'rounded-2xl border border-border bg-card/60'

export function TodaySnapshot({ totalSeconds, totalUnits, clockInTime, onClockInChange }: Props) {
  const { time } = usePhilippineClock()
  const shift = calculateShift(clockInTime, totalSeconds, totalUnits, undefined)
  const clockOutText = formatMilitaryTime(shift.estimatedClockOutSeconds)

  const setClockInNow = () => {
    if (onClockInChange) onClockInChange(time)
    else window.dispatchEvent(new CustomEvent('sif:set-clock-in-now', { detail: time }))
  }

  return (
    <section id="dashboard" className="scroll-mt-20" aria-labelledby="shift-heading">
      <div className="mb-5">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">02 / Shift</p>
        <h2 id="shift-heading" className="mt-1 text-xl font-semibold tracking-tight">Live shift</h2>
        <p className="mt-1 text-[9px] leading-4 text-muted-foreground">Tap the Clock In time to edit.</p>
      </div>

      <div className={`${CARD_CLASS} overflow-hidden`}>
        <div className="px-4 sm:px-5">
          <div className="grid min-h-[68px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight">Clock in</p>
              <p className="mt-0.5 text-[9px] text-muted-foreground">Tap the time to edit</p>
            </div>
            <button type="button" className="cursor-pointer font-mono text-sm font-bold tabular-nums" aria-label={`Edit Clock In time, currently ${clockInTime}`} suppressHydrationWarning title="Edit Clock In time" onClick={() => window.dispatchEvent(new Event('sif:edit-clock-in'))}>
              {clockInTime || 'Choose time'}
            </button>
          </div>

          <div className="h-px bg-border" aria-hidden="true" />

          <div className="grid min-h-[68px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight">Clock out</p>
              <p className="mt-0.5 text-[9px] text-muted-foreground">Estimated finish time</p>
            </div>
            <strong className="font-mono text-sm font-bold tabular-nums">{clockOutText}</strong>
          </div>
        </div>

        <div className="border-t border-border p-4 sm:p-5">
          <button type="button" onClick={setClockInNow} className="inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-[9px] font-bold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Set Clock In to current PHT time ${time}`}>
            NOW · {time}
          </button>
        </div>
      </div>
    </section>
  )
}
