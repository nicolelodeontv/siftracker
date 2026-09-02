'use client'

import { useRef, type RefObject } from 'react'
import { Copy } from 'lucide-react'
import { formatDuration, formatMilitaryTime } from '@/lib/calculator'
import { calculateShift } from '@/lib/shift'
import { usePhilippineClock } from '@/lib/use-philippine-clock'

const cardClass = 'rounded-xl border border-border bg-card/95 shadow-md backdrop-blur'

type BaseProps = {
  totalSeconds: number
  totalUnits: number
  clockInTime: string
}

type SummaryProps = BaseProps & {
  shiftRef?: RefObject<HTMLElement | null>
  onClockInChange: (value: string) => void
  onSetClockInNow: (value: string) => void
  onCopyClockOut: (value: string) => void
}

export function ShiftSummary({ totalSeconds, totalUnits, clockInTime, shiftRef, onClockInChange, onSetClockInNow, onCopyClockOut }: SummaryProps) {
  const { time, date, seconds: nowSeconds } = usePhilippineClock()
  const fallbackRef = useRef<HTMLElement | null>(null)
  const sectionRef = shiftRef ?? fallbackRef
  const shift = calculateShift(clockInTime, totalSeconds, totalUnits, nowSeconds)
  const clockOut = formatMilitaryTime(shift.estimatedClockOutSeconds)

  return (
    <section ref={sectionRef} id="shift" className={`${cardClass} mt-4 p-4`}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">03 / Shift Summary</p>
          <h2 className="mt-1 text-base font-semibold tracking-tight">Know when you’re done.</h2>
        </div>
        <div className="text-right">
          <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Today · {date}</p>
          <p className="mt-0.5 text-[8px] text-muted-foreground">Fixed 01:00:00 break</p>
        </div>
      </div>

      <div className="shift-summary-grid">
        <div className="shift-summary-card">
          <span className="shift-summary-label">Clock in</span>
          <button
            type="button"
            className="clock-in-display cursor-pointer"
            aria-label={`Edit Clock In time, currently ${clockInTime}`}
            title="Edit Clock In time"
          >
            {clockInTime || 'Choose time'}
          </button>
          <input id="clock-in-hidden" type="time" step="1" value={clockInTime} onChange={(event) => onClockInChange(event.target.value)} className="sr-only" tabIndex={-1} aria-hidden="true" />
          <div className="mt-2 flex justify-center">
            <button type="button" onClick={() => onSetClockInNow(time)} className="rounded-full border border-border bg-card px-5 py-2 text-[10px] font-bold shadow-sm transition hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">NOW · {time}</button>
          </div>
        </div>

        <SummaryMetric label="Worked" value={formatDuration(totalSeconds)} note="Workload time only." />
        <SummaryMetric label="Break" value="01:00:00" note="Fixed 1-hour break." />

        <div className={`shift-clockout-card ${shift.shiftComplete ? 'is-complete' : ''}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="shift-summary-label">Clock Out</span>
              <strong className="mt-1 block whitespace-nowrap font-mono text-2xl font-bold tracking-[-0.04em] tabular-nums sm:text-3xl">{clockOut}</strong>
            </div>
            {shift.estimatedClockOutSeconds !== null && (
              <button type="button" onClick={() => onCopyClockOut(clockOut)} className="rounded-md p-1.5 text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Copy Clock Out time" title="Copy Clock Out time">
                <Copy className="size-3.5" />
              </button>
            )}
          </div>
          <span className={`mt-1 block text-[8px] ${shift.shiftComplete ? 'font-bold text-[var(--sif-green)]' : 'text-muted-foreground'}`}>
            {shift.estimatedClockOutSeconds === null ? 'Enter a workload to calculate' : shift.shiftComplete ? '✓ SHIFT COMPLETE' : 'ON TRACK · TIME UNTIL CLOCK OUT'}
          </span>
          {shift.estimatedClockOutSeconds !== null && <strong className="mt-1.5 block font-mono text-xs font-bold tabular-nums text-primary">{shift.shiftComplete ? '00:00:00' : formatDuration(shift.timeLeftSeconds)}</strong>}
        </div>
      </div>
    </section>
  )
}

function SummaryMetric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="shift-summary-card">
      <span className="shift-summary-label">{label}</span>
      <strong className="mt-1 block font-mono text-lg font-bold tabular-nums">{value}</strong>
      <span className="mt-1 block text-[8px] text-muted-foreground">{note}</span>
    </div>
  )
}
