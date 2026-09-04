'use client'

import { useMemo, type ReactNode } from 'react'
import { Activity, Clock3, Coffee, Gauge, Timer, TrendingUp, Play } from 'lucide-react'
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
  calculatedValues: Array<{ workload: Workload; input: string }>
  onClockInChange?: (value: string) => void
}

type DashboardMetricProps = { icon: ReactNode; label: string; value: string; note: string; accent: string }

const cardClass = 'rounded-xl border border-border bg-card/85 shadow-[0_10px_30px_var(--card-shadow)] backdrop-blur'

export function TodaySnapshot({ totalSeconds, totalUnits, activeWorkloads, activeWorkloadCount, clockInTime, calculatedValues, onClockInChange }: Props) {
  const { seconds: nowSeconds, time, date } = usePhilippineClock()
  const shift = calculateShift(clockInTime, totalSeconds, totalUnits, nowSeconds)
  const workloadColors: Record<string, string> = {
    lateOrders: 'var(--sif-orange)',
    indiClip: 'var(--chart-2)',
    indiEdit: 'var(--chart-3)',
    indiBuild: 'var(--chart-4)',
    teamEdit: 'var(--chart-1)',
  }
  const liveColors = {
    live: '#22D3EE',
    remaining: '#FACC15',
    clockIn: '#A78BFA',
    clockOut: '#FB7185',
    active: '#34D399',
    work: '#60A5FA',
    break: '#F472B6',
    status: '#F59E0B',
  }
  const progress = shift.shiftSeconds > 0 ? Math.min(100, Math.round((shift.elapsedShiftSeconds / shift.shiftSeconds) * 100)) : 0
  const status = shift.shiftStatus
  const statusClass = shift.shiftComplete
    ? 'bg-[var(--sif-green)]/10 text-[var(--sif-green)]'
    : totalUnits > 0
      ? 'bg-[var(--sif-green)]/10 text-[var(--sif-green)]'
      : 'bg-muted text-muted-foreground'

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
  const breakStartSeconds = shift.clockInSeconds === null ? null : shift.clockInSeconds + totalSeconds
  const breakEndSeconds = breakStartSeconds === null ? null : breakStartSeconds + 60 * 60
  const clockOutText = formatMilitaryTime(shift.estimatedClockOutSeconds)
  const setClockInNow = () => {
    if (onClockInChange) {
      onClockInChange(time)
    } else {
      window.dispatchEvent(new CustomEvent('sif:set-clock-in-now', { detail: time }))
    }
  }

  return (
    <section id="dashboard" aria-label="SIF dashboard" className={`${cardClass} mb-4 overflow-hidden`}>
      <div className="border-b border-border bg-background/30 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${liveColors.live} 12%, transparent)`, color: liveColors.live }}><Gauge className="size-4" /></div>
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
              <DashboardLiveMetric label="Live worked" value={formatDuration(shift.elapsedShiftSeconds)} accent={liveColors.live} />
              <DashboardLiveMetric label="Time remaining" value={shift.estimatedClockOutSeconds === null ? '—' : formatDuration(shift.timeLeftSeconds)} accent={liveColors.remaining} />
            </div>
          </div>

          <div className="grid w-full shrink-0 gap-2 sm:w-[28rem] sm:grid-cols-2">
            <div className="rounded-lg border p-3" style={{ borderColor: `color-mix(in srgb, ${liveColors.clockIn} 30%, var(--border))`, backgroundColor: `color-mix(in srgb, ${liveColors.clockIn} 5%, transparent)` }}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[7px] font-bold uppercase tracking-[0.14em]" style={{ color: liveColors.clockIn }}>Clock In</span>
                <TrendingUp className="size-3" style={{ color: liveColors.clockIn }} />
              </div>
              <button type="button" className="clock-in-display cursor-pointer" aria-label={`Edit Clock In time, currently ${clockInTime}`} suppressHydrationWarning title="Edit Clock In time" onClick={() => window.dispatchEvent(new Event('sif:edit-clock-in'))}>{clockInTime || 'Choose time'}</button>
              <div className="mt-2 flex justify-center"><button type="button" onClick={setClockInNow} className="inline-flex min-h-8 items-center justify-center rounded-full border border-border bg-background px-4 py-1.5 text-[9px] font-bold shadow-sm transition hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Set Clock In to current PHT time ${time}`}><Play className="mr-1 inline size-2.5" />NOW · {time}</button></div>
            </div>

            <div className="relative rounded-lg border p-3" style={{ borderColor: `color-mix(in srgb, ${liveColors.clockOut} 30%, transparent)`, backgroundColor: `color-mix(in srgb, ${liveColors.clockOut} 5%, transparent)` }}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[7px] font-bold uppercase tracking-[0.14em]" style={{ color: liveColors.clockOut }}>Clock Out</span>
                <Clock3 className="size-3 shrink-0" style={{ color: liveColors.clockOut }} />
              </div>
              <div className="relative mt-1 min-h-8">
                <strong className="block font-mono text-2xl font-bold tabular-nums tracking-[-0.04em]" style={{ color: liveColors.clockOut }}>{clockOutText}</strong>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Shift progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${progress}%`, backgroundColor: shift.shiftComplete ? 'var(--sif-green)' : liveColors.remaining }} />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[7px] font-semibold uppercase tracking-[0.12em]"><span style={{ color: shift.shiftComplete ? 'var(--sif-green)' : liveColors.remaining }}>{progress}% complete</span><span style={{ color: liveColors.break }}>01:00:00 break</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 border-b border-border sm:grid-cols-4">
        <DashboardMetric icon={<Activity className="size-3" />} label="Active workloads" value={`${activeWorkloadCount}/${activeWorkloads}`} note={`${totalUnits} total units`} accent={liveColors.active} />
        <DashboardMetric icon={<Timer className="size-3" />} label="Work time" value={formatDuration(totalSeconds)} note="Calculated workload" accent={liveColors.work} />
        <DashboardMetric icon={<Coffee className="size-3" />} label="Break" value="01:00:00" note="Fixed 1-hour break" accent={liveColors.break} />
        <DashboardMetric icon={<TrendingUp className="size-3" />} label="Status" value={status} note="Live shift status" accent={liveColors.status} />
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.35fr_.65fr]">
        <div className="min-w-0 border-b border-border p-4 lg:border-b-0 lg:border-r sm:p-5">
          <div className="flex items-end justify-between gap-3"><div><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Workload breakdown</p><h3 className="mt-1 text-sm font-semibold tracking-tight">Where today&apos;s time is going</h3></div><span className="font-mono text-[8px] font-bold text-muted-foreground">{breakdown.length} active</span></div>
          <div className="mt-4 space-y-3">{breakdown.length > 0 ? breakdown.map((item) => { const color = workloadColors[item.id] ?? 'var(--sif-cyan)'; const share = totalSeconds > 0 ? Math.min(100, Math.round((item.duration / totalSeconds) * 100)) : 0; const width = Math.max(7, Math.round((item.duration / maxDuration) * 100)); return <div key={item.id} className="min-w-0"><div className="flex items-center justify-between gap-3 text-[8px] font-semibold"><div className="flex min-w-0 items-center gap-2"><span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" /><span className="truncate">{item.label}</span><span className="font-mono text-muted-foreground">{item.quantity}</span></div><span className="shrink-0 font-mono tabular-nums text-muted-foreground">{formatDuration(item.duration)} · {share}%</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${width}%`, backgroundColor: color }} /></div></div> }) : <div className="rounded-lg border border-dashed border-border bg-background/30 px-3 py-5 text-center text-[9px] text-muted-foreground">Add workload quantities above to populate the live breakdown.</div>}</div>
        </div>
        <div className="min-w-0 p-4 sm:p-5"><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Shift timeline</p><h3 className="mt-1 text-sm font-semibold tracking-tight">Your workday at a glance</h3><div className="relative mt-5 space-y-3 pl-1"><TimelineItem label="Clock In" value={shift.clockInSeconds === null ? '—' : formatMilitaryTime(shift.clockInSeconds)} accent="violet" active /><TimelineItem label="Work complete" value={breakStartSeconds === null ? '—' : formatMilitaryTime(breakStartSeconds)} accent="blue" /><TimelineItem label="Break" value={breakStartSeconds === null ? '—' : `${formatMilitaryTime(breakStartSeconds)} → ${formatMilitaryTime(breakEndSeconds)}`} accent="pink" /><TimelineItem label="Clock Out" value={clockOutText} accent="red" active={shift.shiftComplete} /></div><p className="mt-5 rounded-lg border border-border bg-background/35 px-3 py-2 text-[8px] leading-4 text-muted-foreground">Timeline uses Clock In + calculated workload time + the fixed 1-hour break.</p></div>
      </div>
    </section>
  )
}

function DashboardLiveMetric({ label, value, accent }: { label: string; value: string; accent: string }) { return <div><span className="block text-[7px] font-bold uppercase tracking-[0.14em]" style={{ color: accent }}>{label}</span><strong className="mt-0.5 block font-mono text-xl font-bold tabular-nums" style={{ color: accent }}>{value}</strong></div> }
function DashboardMetric({ icon, label, value, note, accent }: DashboardMetricProps) { return <div className="min-w-0 border-r border-border px-3 py-3 last:border-r-0 sm:px-4"><div className="flex items-center gap-1.5" style={{ color: accent }}>{icon}<span className="text-[7px] font-bold uppercase tracking-[0.14em]">{label}</span></div><strong className="mt-1 block truncate font-mono text-sm font-bold tabular-nums tracking-[-0.02em]" style={{ color: accent }}>{value}</strong><span className="mt-0.5 block truncate text-[7px] text-muted-foreground">{note}</span></div> }
function TimelineItem({ label, value, accent, active }: { label: string; value: string; accent: 'violet' | 'blue' | 'pink' | 'red'; active?: boolean }) {
  const colors = {
    violet: '#A78BFA',
    blue: '#60A5FA',
    pink: '#F472B6',
    red: '#F87171',
  }
  const color = colors[accent]

  return (
    <div
      className="relative flex items-start gap-3 rounded-lg border px-2 py-1.5"
      style={{
        borderColor: `color-mix(in srgb, ${color} 20%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${color} 7%, transparent)`,
      }}
    >
      <div className="relative z-10 flex w-3 shrink-0 justify-center">
        <span
          className="mt-1.5 size-2.5 rounded-full border-2 border-card ring-1"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 0 1px color-mix(in srgb, ${color} 35%, transparent), 0 0 10px color-mix(in srgb, ${color} 20%, transparent)`,
          }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <span className="block text-[7px] font-bold uppercase tracking-[0.14em]" style={{ color }}>{label}</span>
        <strong className="mt-0.5 block truncate font-mono text-[11px] font-bold tabular-nums" style={{ color, opacity: active ? 1 : 0.75 }}>{value}</strong>
      </div>
    </div>
  )
}
type BreakdownItem = { id: string; label: string; duration: number; quantity: number }
