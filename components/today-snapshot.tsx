'use client'

import { useMemo, type ReactNode } from 'react'
import { Clock3, Coffee, Gauge, Timer, TrendingUp } from 'lucide-react'
import { calculateValue, formatDuration, formatMilitaryTime } from '@/lib/calculator'
import type { Workload } from '@/lib/workloads'
import { calculateShift } from '@/lib/shift'
import { usePhilippineClock } from '@/lib/use-philippine-clock'

type Props = {
  totalSeconds: number
  totalUnits: number
  activeWorkloads: number
  activeWorkloadCount: number
  clockInTime: string
  calculatedValues: Array<{ workload: Workload; input: string; value: number | null }>
  onClockInChange?: (value: string) => void
}

export function TodaySnapshot({ totalSeconds, totalUnits, activeWorkloads, activeWorkloadCount, clockInTime, calculatedValues, onClockInChange }: Props) {
  const { seconds: nowSeconds, time, date } = usePhilippineClock()
  const shift = calculateShift(clockInTime, totalSeconds, totalUnits, nowSeconds)
  const progress = shift.shiftSeconds > 0 ? Math.min(100, Math.round((shift.elapsedShiftSeconds / shift.shiftSeconds) * 100)) : 0

  const breakdown = useMemo(
    () => calculatedValues
      .map(({ workload, input }) => ({
        id: workload.id,
        label: workload.label,
        duration: Math.max(0, workload.minutesPerUnit * 60 * (calculateValue(input) ?? 0)),
        quantity: Math.max(0, calculateValue(input) ?? 0),
      }))
      .filter((item) => item.quantity > 0)
      .sort((a, b) => b.duration - a.duration),
    [calculatedValues],
  )

  const maxDuration = useMemo(() => Math.max(...breakdown.map((item) => item.duration), 1), [breakdown])
  const breakStartSeconds = shift.clockInSeconds === null || totalUnits === 0 ? null : shift.clockInSeconds + totalSeconds
  const breakEndSeconds = breakStartSeconds === null ? null : breakStartSeconds + 60 * 60
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

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_10px_32px_var(--card-shadow)]">
        <div className="grid gap-0 md:grid-cols-[1fr_1fr]">
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Gauge className="size-4" />
                  </div>
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Current status</p>
                    <p className="mt-0.5 text-xs font-semibold">PHT · {date} · {time}</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-4">
                  <div>
                    <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-primary">{shift.shiftStatus}</span>
                    <p className="mt-2 text-[8px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Progress</p>
                    <strong className="mt-0.5 block font-mono text-2xl font-bold tabular-nums">{progress}%</strong>
                  </div>
                  <Metric icon={<Timer className="size-3" />} label="Worked" value={formatDuration(shift.elapsedShiftSeconds)} />
                  <Metric icon={<TrendingUp className="size-3" />} label="Remaining" value={shift.estimatedClockOutSeconds === null ? '—' : formatDuration(shift.timeLeftSeconds)} />
                </div>
              </div>
            </div>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Shift progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="border-t border-border p-5 md:border-l md:border-t-0 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Clock In</p>
                <button type="button" className="mt-2 cursor-pointer font-mono text-3xl font-bold tracking-[-0.04em] tabular-nums" aria-label={`Edit Clock In time, currently ${clockInTime}`} suppressHydrationWarning title="Edit Clock In time" onClick={() => window.dispatchEvent(new Event('sif:edit-clock-in'))}>{clockInTime || 'Choose time'}</button>
                <button type="button" onClick={setClockInNow} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-[9px] font-bold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Set Clock In to current PHT time ${time}`}>NOW · {time}</button>
              </div>

              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Clock Out</p>
                <strong className="mt-2 block font-mono text-3xl font-bold tracking-[-0.04em] tabular-nums">{clockOutText}</strong>
                <div className="mt-3 flex items-center gap-2 text-[8px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <Coffee className="size-3" />
                  01:00:00 break
                </div>
              </div>
            </div>
          </div>
        </div>

        <details className="border-t border-border">
          <summary className="cursor-pointer list-none px-5 py-4 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground transition hover:bg-accent sm:px-6">
            <span className="flex items-center justify-between gap-4">Details <span className="font-mono text-[8px] normal-case tracking-normal">{activeWorkloadCount}/{activeWorkloads} active</span></span>
          </summary>
          <div className="grid gap-8 border-t border-border p-5 sm:p-6 lg:grid-cols-2">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Workload breakdown</p>
              <h3 className="mt-1 text-sm font-semibold tracking-tight">Where today&apos;s time is going</h3>
              <div className="mt-4 space-y-4">
                {breakdown.length > 0 ? breakdown.map((item) => {
                  const share = totalSeconds > 0 ? Math.min(100, Math.round((item.duration / totalSeconds) * 100)) : 0
                  const width = Math.max(7, Math.round((item.duration / maxDuration) * 100))
                  return (
                    <div key={item.id}>
                      <div className="flex items-center justify-between gap-3 text-[9px] font-semibold">
                        <div className="flex min-w-0 items-center gap-2"><span className="truncate">{item.label}</span><span className="font-mono text-muted-foreground">{item.quantity}</span></div>
                        <span className="shrink-0 font-mono tabular-nums text-muted-foreground">{formatDuration(item.duration)} · {share}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${width}%` }} /></div>
                    </div>
                  )
                }) : <p className="border-t border-border pt-4 text-[9px] text-muted-foreground">Add workload quantities above to populate the live breakdown.</p>}
              </div>
            </div>

            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Timeline</p>
              <h3 className="mt-1 text-sm font-semibold tracking-tight">Your workday at a glance</h3>
              <div className="mt-4 divide-y divide-border border-y border-border">
                <TimelineRow label="Clock In" value={shift.clockInSeconds === null ? '—' : formatMilitaryTime(shift.clockInSeconds)} />
                <TimelineRow label="Work complete" value={breakStartSeconds === null ? '—' : formatMilitaryTime(breakStartSeconds)} />
                <TimelineRow label="Break" value={breakStartSeconds === null ? '—' : `${formatMilitaryTime(breakStartSeconds)} → ${formatMilitaryTime(breakEndSeconds)}`} />
                <TimelineRow label="Clock Out" value={clockOutText} />
              </div>
              <p className="mt-4 text-[8px] leading-4 text-muted-foreground">Clock Out = Clock In + calculated workload time + the fixed 1-hour break.</p>
            </div>
          </div>
        </details>
      </div>
    </section>
  )
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div><span className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{icon}{label}</span><strong className="mt-1 block font-mono text-lg font-bold tabular-nums">{value}</strong></div>
}

function TimelineRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 py-3 text-[9px]"><span className="font-semibold text-muted-foreground">{label}</span><strong className="font-mono font-semibold tabular-nums">{value}</strong></div>
}
