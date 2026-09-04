'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { Activity, Check, Clock3, Coffee, Copy, Gauge, Timer, TrendingUp } from 'lucide-react'
import { calculateValue, formatDuration, formatMilitaryTime } from '@/lib/calculator'
import { calculateShift } from '@/lib/shift'
import { usePhilippineClock } from '@/lib/use-philippine-clock'
import type { Workload } from '@/lib/workloads'

type CalculatedValue = {
  workload: Workload
  input: string
}

type Props = {
  totalSeconds: number
  totalUnits: number
  workloads: Workload[]
  calculatedValues: CalculatedValue[]
  clockInTime: string
}

const cardClass = 'rounded-xl border border-border bg-card/85 shadow-[0_10px_30px_var(--card-shadow)] backdrop-blur'

export function DashboardOverview({ totalSeconds, totalUnits, workloads, calculatedValues, clockInTime }: Props) {
  const { seconds: nowSeconds, time, date } = usePhilippineClock()
  const [copied, setCopied] = useState(false)
  const shift = calculateShift(clockInTime, totalSeconds, totalUnits, nowSeconds)
  const progress = shift.shiftSeconds > 0 ? Math.min(100, Math.round((shift.elapsedShiftSeconds / shift.shiftSeconds) * 100)) : 0
  const status = shift.shiftStatus
  const statusClass = shift.shiftComplete
    ? 'border-[var(--sif-green)]/30 bg-[var(--sif-green)]/10 text-[var(--sif-green)]'
    : totalUnits > 0
      ? 'border-[var(--sif-green)]/30 bg-[var(--sif-green)]/10 text-[var(--sif-green)]'
      : 'border-border bg-muted text-muted-foreground'
  const workedClass = 'text-[var(--sif-green)]'
  const remainingClass = shift.shiftComplete
    ? 'text-[var(--sif-green)]'
    : shift.estimatedClockOutSeconds === null
      ? 'text-muted-foreground'
      : 'text-[var(--sif-yellow)]'
  const active = calculatedValues.filter(({ input }) => {
    const value = calculateValue(input)
    return value !== null && value > 0
  }).length

  const ranked = calculatedValues
    .map(({ workload, input }) => {
      const value = Math.max(0, calculateValue(input) ?? 0)
      const duration = value * workload.minutesPerUnit * 60
      return { workload, value, duration }
    })
    .filter(({ value }) => value > 0)
    .sort((a, b) => b.duration - a.duration)

  const breakStartSeconds = shift.clockInSeconds === null ? null : shift.clockInSeconds + totalSeconds
  const breakEndSeconds = breakStartSeconds === null ? null : breakStartSeconds + 60 * 60
  const clockOutText = formatMilitaryTime(shift.estimatedClockOutSeconds)

  async function copyClockOut() {
    if (shift.estimatedClockOutSeconds === null) return
    try {
      await navigator.clipboard.writeText(clockOutText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section id="dashboard" aria-label="SIF dashboard" className={`${cardClass} mb-4 overflow-hidden`}>
      <div className="border-b border-border bg-background/30 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--sif-green)]/10 text-[var(--sif-green)]">
                <Gauge className="size-4" />
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Dashboard / Live Shift</p>
                <p className="mt-0.5 text-xs font-semibold">Production command center</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-2">
              <div>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.13em] ${statusClass}`}>
                  <span className="mr-1.5 size-1.5 rounded-full bg-current" />
                  {status}
                </span>
                <p className="mt-1.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{date} · PHT {time}</p>
              </div>
              <div className="hidden h-8 w-px bg-border sm:block" />
              <div>
                <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Live worked</span>
                <strong className={`mt-0.5 block font-mono text-xl font-bold tabular-nums ${workedClass}`}>{formatDuration(shift.elapsedShiftSeconds)}</strong>
              </div>
              <div>
                <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Time remaining</span>
                <strong className={`mt-0.5 block font-mono text-xl font-bold tabular-nums ${remainingClass}`}>{shift.estimatedClockOutSeconds === null ? '—' : formatDuration(shift.timeLeftSeconds)}</strong>
              </div>
            </div>
          </div>

          <div className="w-full shrink-0 rounded-lg border border-[var(--sif-green)]/25 bg-[var(--sif-green)]/5 p-3 shadow-[0_8px_24px_var(--card-shadow)] sm:w-56">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--sif-green)]">Estimated Clock Out</span>
              <button
                type="button"
                onClick={copyClockOut}
                disabled={shift.estimatedClockOutSeconds === null}
                aria-label={copied ? 'Clock out time copied' : 'Copy estimated clock out time'}
                title={copied ? 'Copied' : 'Copy clock out time'}
                className="inline-flex size-6 items-center justify-center rounded-md border border-border bg-card/70 text-muted-foreground hover:border-[var(--sif-green)]/40 hover:text-[var(--sif-green)] disabled:pointer-events-none disabled:opacity-40"
              >
                {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
              </button>
            </div>
            <button
              type="button"
              onClick={copyClockOut}
              disabled={shift.estimatedClockOutSeconds === null}
              title="Copy 24-hour clock out time"
              className="mt-1 block w-full cursor-pointer text-left disabled:cursor-default"
            >
              <strong className="block font-mono text-2xl font-bold tabular-nums tracking-[-0.04em] text-[var(--sif-green)]">{clockOutText}</strong>
            </button>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Shift progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              <div className={`h-full rounded-full transition-[width] duration-500 ${shift.shiftComplete ? 'bg-[var(--sif-green)]' : 'bg-[var(--sif-yellow)]'}`} style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[7px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <span className={shift.shiftComplete ? 'text-[var(--sif-green)]' : 'text-[var(--sif-yellow)]'}>{progress}% complete</span>
              <span className="text-[var(--sif-yellow)]">01:00:00 break</span>
            </div>
            <span aria-live="polite" className={`mt-1 block text-[7px] font-semibold ${copied ? 'text-[var(--sif-green)]' : 'text-transparent'}`}>{copied ? 'Copied' : 'Copied'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 border-b border-border sm:grid-cols-4">
        <DashboardMetric icon={<Activity className="size-3" />} label="Active workloads" value={`${active}/${workloads.length}`} note={`${totalUnits} total units`} accent="green" />
        <DashboardMetric icon={<Timer className="size-3" />} label="Work time" value={formatDuration(totalSeconds)} note="Calculated workload" accent="violet" />
        <DashboardMetric icon={<Coffee className="size-3" />} label="Break" value="01:00:00" note="Fixed 1-hour break" accent="yellow" />
        <DashboardMetric icon={<TrendingUp className="size-3" />} label="Clock in" value={clockInTime} note="PHT · editable below" accent="blue" />
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.35fr_.65fr]">
        <div className="min-w-0 border-b border-border p-4 lg:border-b-0 lg:border-r sm:p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Workload breakdown</p>
              <h3 className="mt-1 text-sm font-semibold tracking-tight">Where today&apos;s time is going</h3>
            </div>
            <span className="font-mono text-[8px] font-bold text-muted-foreground">{ranked.length} active</span>
          </div>

          <div className="mt-4 space-y-3">
            {ranked.length > 0 ? ranked.map(({ workload, value, duration }) => {
              const share = totalSeconds > 0 ? Math.min(100, Math.round((duration / totalSeconds) * 100)) : 0
              return (
                <div key={workload.id} className="min-w-0">
                  <div className="flex items-center justify-between gap-3 text-[8px] font-semibold">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: workload.accent }} aria-hidden="true" />
                      <span className="truncate">{workload.label}</span>
                      <span className="font-mono text-muted-foreground">{value}</span>
                    </div>
                    <span className="shrink-0 font-mono tabular-nums text-muted-foreground">{formatDuration(duration)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-[var(--sif-violet)]/80 transition-[width] duration-300" style={{ width: `${share}%` }} />
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
          <div className="mt-5 space-y-4">
            <TimelineItem label="Clock In" value={shift.clockInSeconds === null ? '—' : formatMilitaryTime(shift.clockInSeconds)} accent="blue" active />
            <TimelineItem label="Work complete" value={shift.clockInSeconds === null ? '—' : formatMilitaryTime(breakStartSeconds)} accent="violet" />
            <TimelineItem label="Break" value={shift.clockInSeconds === null ? '—' : `${formatMilitaryTime(breakStartSeconds)} → ${formatMilitaryTime(breakEndSeconds)}`} accent="yellow" breakPoint />
            <TimelineItem label="Clock Out" value={clockOutText} accent={shift.shiftComplete ? 'green' : 'orange'} active={shift.shiftComplete} />
          </div>
          <p className="mt-5 rounded-lg border border-border bg-background/35 px-3 py-2 text-[8px] leading-4 text-muted-foreground">
            Timeline is calculated from Clock In + workload time + the fixed 1-hour break.
          </p>
        </div>
      </div>
    </section>
  )
}

function DashboardMetric({ icon, label, value, note, accent }: { icon: ReactNode; label: string; value: string; note: string; accent: 'green' | 'violet' | 'yellow' | 'blue' }) {
  const accentClass = {
    green: 'text-[var(--sif-green)]',
    violet: 'text-[var(--sif-violet)]',
    yellow: 'text-[var(--sif-yellow)]',
    blue: 'text-[var(--sif-blue)]',
  }[accent]

  return (
    <div className="min-w-0 border-r border-border px-3 py-3 last:border-r-0 sm:px-4">
      <div className={`flex items-center gap-1.5 ${accentClass}`}>
        {icon}
        <span className="text-[7px] font-bold uppercase tracking-[0.14em]">{label}</span>
      </div>
      <strong className="mt-1 block truncate font-mono text-sm font-bold tabular-nums tracking-[-0.02em]">{value}</strong>
      <span className="mt-0.5 block truncate text-[7px] text-muted-foreground">{note}</span>
    </div>
  )
}

function TimelineItem({ label, value, active, breakPoint, accent }: { label: string; value: string; active?: boolean; breakPoint?: boolean; accent: 'green' | 'violet' | 'yellow' | 'blue' | 'orange' }) {
  const accentClass = {
    green: 'bg-[var(--sif-green)] ring-[var(--sif-green)]/20',
    violet: 'bg-[var(--sif-violet)] ring-[var(--sif-violet)]/20',
    yellow: 'bg-[var(--sif-yellow)] ring-[var(--sif-yellow)]/20',
    blue: 'bg-[var(--sif-blue)] ring-[var(--sif-blue)]/20',
    orange: 'bg-[var(--sif-orange)] ring-[var(--sif-orange)]/20',
  }[accent]

  return (
    <div className="relative flex items-start gap-3">
      <div className="relative flex w-4 shrink-0 justify-center">
        <span className={`mt-1.5 size-2 rounded-full border-2 border-card ring-1 ${active ? accentClass : 'bg-background ring-border'}`} />
      </div>
      <div className="min-w-0 flex-1">
        <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
        <strong className="mt-0.5 block truncate font-mono text-[11px] font-bold tabular-nums">{value}</strong>
      </div>
    </div>
  )
}
