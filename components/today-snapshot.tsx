'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Activity, Clock3, Coffee, Gauge, Timer, TrendingUp } from 'lucide-react'
import { calculateValue, formatDuration, formatMilitaryTime } from '@/lib/calculator'
import { calculateShift } from '@/lib/shift'
import { usePhilippineClock } from '@/lib/use-philippine-clock'

const cardClass = 'rounded-xl border border-border bg-card/85 shadow-[0_10px_30px_var(--card-shadow)] backdrop-blur'

type BreakdownItem = {
  id: string
  label: string
  duration: number
  quantity: number
}

type Props = {
  totalSeconds: number
  totalUnits: number
  activeWorkloads: number
  activeWorkloadCount: number
  clockInTime: string
}

export function TodaySnapshot({ totalSeconds, totalUnits, activeWorkloads, activeWorkloadCount, clockInTime }: Props) {
  const { seconds: nowSeconds, time, date } = usePhilippineClock()
  const [breakdown, setBreakdown] = useState<BreakdownItem[]>([])
  const shift = calculateShift(clockInTime, totalSeconds, totalUnits, nowSeconds)
  const progress = shift.shiftSeconds > 0 ? Math.min(100, Math.round((shift.elapsedShiftSeconds / shift.shiftSeconds) * 100)) : 0
  const status = shift.shiftStatus
  const statusClass = shift.shiftComplete
    ? 'bg-[var(--sif-green)]/10 text-[var(--sif-green)]'
    : totalUnits > 0
      ? 'bg-primary/10 text-primary'
      : 'bg-muted text-muted-foreground'

  useEffect(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>('.workload-card[data-workload-id]'))
    const next = cards
      .map((card) => {
        const id = card.dataset.workloadId ?? ''
        const label = card.dataset.workloadLabel ?? id
        const duration = Number(card.dataset.durationSeconds ?? 0)
        const input = (card.querySelector('input') as HTMLInputElement | null)?.value ?? ''
        const quantity = Math.max(0, calculateValue(input) ?? 0)
        return { id, label, duration, quantity }
      })
      .filter((item) => item.quantity > 0)
      .sort((a, b) => b.duration - a.duration)
    setBreakdown(next)
  }, [totalSeconds, totalUnits, activeWorkloadCount])

  const maxDuration = useMemo(() => Math.max(...breakdown.map((item) => item.duration), 1), [breakdown])
  const breakStartSeconds = shift.clockInSeconds === null ? null : shift.clockInSeconds + totalSeconds
  const breakEndSeconds = breakStartSeconds === null ? null : breakStartSeconds + 60 * 60

  return (
    <section id="dashboard" aria-label="SIF dashboard" className={`${cardClass} mb-4 overflow-hidden`}>
      <div className="border-b border-border bg-background/30 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Gauge className="size-4" /></div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Dashboard / Live Shift</p>
                <p className="mt-0.5 text-xs font-semibold">Production command center</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-x-5 gap-y-3">
              <div>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.13em] ${statusClass}`}>{status}</span>
                <p className="mt-1.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{date} · PHT {time}</p>
              </div>
              <DashboardLiveMetric label="Live worked" value={formatDuration(shift.elapsedShiftSeconds)} />
              <DashboardLiveMetric label="Time remaining" value={shift.estimatedClockOutSeconds === null ? '—' : formatDuration(shift.timeLeftSeconds)} emphasis />
            </div>
          </div>

          <div className="w-full shrink-0 rounded-lg border border-border bg-card p-3 sm:w-56">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Clock Out</span>
              <Clock3 className="size-3 text-primary" />
            </div>
            <strong className="mt-1 block font-mono text-2xl font-bold tabular-nums tracking-[-0.04em]">{formatMilitaryTime(shift.estimatedClockOutSeconds)}</strong>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Shift progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[7px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <span>{progress}% complete</span>
              <span>01:00:00 break</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 border-b border-border sm:grid-cols-4">
        <DashboardMetric icon={<Activity className="size-3" />} label="Active workloads" value={`${activeWorkloadCount}/${activeWorkloads}`} note={`${totalUnits} total units`} />
        <DashboardMetric icon={<Timer className="size-3" />} label="Work time" value={formatDuration(totalSeconds)} note="Calculated workload" />
        <DashboardMetric icon={<Coffee className="size-3" />} label="Break" value="01:00:00" note="Fixed 1-hour break" />
        <DashboardMetric icon={<TrendingUp className="size-3" />} label="Clock in" value={clockInTime} note="PHT · editable below" />
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.35fr_.65fr]">
        <div className="min-w-0 border-b border-border p-4 lg:border-b-0 lg:border-r sm:p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Workload breakdown</p>
              <h3 className="mt-1 text-sm font-semibold tracking-tight">Where today&apos;s time is going</h3>
            </div>
            <span className="font-mono text-[8px] font-bold text-muted-foreground">{breakdown.length} active</span>
          </div>

          <div className="mt-4 space-y-3">
            {breakdown.length > 0 ? breakdown.map((item) => {
              const share = totalSeconds > 0 ? Math.min(100, Math.round((item.duration / totalSeconds) * 100)) : 0
              const width = Math.max(7, Math.round((item.duration / maxDuration) * 100))
              return (
                <div key={item.id} className="min-w-0">
                  <div className="flex items-center justify-between gap-3 text-[8px] font-semibold">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                      <span className="font-mono text-muted-foreground">{item.quantity}</span>
                    </div>
                    <span className="shrink-0 font-mono tabular-nums text-muted-foreground">{formatDuration(item.duration)} · {share}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary/70 transition-[width] duration-300" style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            }) : (
              <div className="rounded-lg border border-dashed border-border bg-background/30 px-3 py-5 text-center text-[9px] text-muted-foreground">
                Add workload quantities above to populate the live breakdown.
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 p-4 sm:p-5">
          <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Shift timeline</p>
          <h3 className="mt-1 text-sm font-semibold tracking-tight">Your workday at a glance</h3>
          <div className="relative mt-5 space-y-4 pl-1">
            <div className="absolute left-[4px] top-2 bottom-2 w-px bg-border" aria-hidden="true" />
            <TimelineItem label="Clock In" value={shift.clockInSeconds === null ? '—' : formatMilitaryTime(shift.clockInSeconds)} active />
            <TimelineItem label="Work complete" value={breakStartSeconds === null ? '—' : formatMilitaryTime(breakStartSeconds)} />
            <TimelineItem label="Break" value={breakStartSeconds === null ? '—' : `${formatMilitaryTime(breakStartSeconds)} → ${formatMilitaryTime(breakEndSeconds)}`} breakPoint />
            <TimelineItem label="Clock Out" value={formatMilitaryTime(shift.estimatedClockOutSeconds)} active={shift.shiftComplete} />
          </div>
          <p className="mt-5 rounded-lg border border-border bg-background/35 px-3 py-2 text-[8px] leading-4 text-muted-foreground">Timeline uses Clock In + calculated workload time + the fixed 1-hour break.</p>
        </div>
      </div>
    </section>
  )
}

function DashboardLiveMetric({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div>
      <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <strong className={`mt-0.5 block font-mono text-xl font-bold tabular-nums ${emphasis ? 'text-primary' : ''}`}>{value}</strong>
    </div>
  )
}

function DashboardMetric({ icon, label, value, note }: { icon: ReactNode; label: string; value: string; note: string }) {
  return (
    <div className="min-w-0 border-r border-border px-3 py-3 last:border-r-0 sm:px-4">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[7px] font-bold uppercase tracking-[0.14em]">{label}</span>
      </div>
      <strong className="mt-1 block truncate font-mono text-sm font-bold tabular-nums tracking-[-0.02em]">{value}</strong>
      <span className="mt-0.5 block truncate text-[7px] text-muted-foreground">{note}</span>
    </div>
  )
}

function TimelineItem({ label, value, active, breakPoint }: { label: string; value: string; active?: boolean; breakPoint?: boolean }) {
  return (
    <div className="relative flex items-start gap-3">
      <div className="relative z-10 flex w-3 shrink-0 justify-center">
        <span className={`mt-1.5 size-2 rounded-full border-2 border-card ring-1 ${breakPoint ? 'bg-muted-foreground/60 ring-muted-foreground/20' : active ? 'bg-primary ring-primary/20' : 'bg-background ring-border'}`} />
      </div>
      <div className="min-w-0 flex-1">
        <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
        <strong className="mt-0.5 block truncate font-mono text-[11px] font-bold tabular-nums">{value}</strong>
      </div>
    </div>
  )
}
