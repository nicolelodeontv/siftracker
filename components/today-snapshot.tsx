'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { Activity, Check, Clock3, Coffee, Copy, Gauge, Timer, TrendingUp, Play } from 'lucide-react'
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
}

type DashboardMetricProps = { icon: ReactNode; label: string; value: string; note: string }

const cardClass = 'rounded-xl border border-border bg-card/85 shadow-[0_10px_30px_var(--card-shadow)] backdrop-blur'

export function TodaySnapshot({ totalSeconds, totalUnits, activeWorkloads, activeWorkloadCount, clockInTime, calculatedValues }: Props) {
  const { seconds: nowSeconds, time, date } = usePhilippineClock()
  const [copied, setCopied] = useState(false)
  const shift = calculateShift(clockInTime, totalSeconds, totalUnits, nowSeconds)
  const workloadColors = ['var(--sif-cyan)', 'var(--sif-orange)', 'var(--sif-green)', 'var(--sif-yellow)'] as const
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

          <div className="grid w-full shrink-0 gap-2 sm:w-[28rem] sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Clock In</span>
                <TrendingUp className="size-3 text-primary" />
              </div>
              <button type="button" className="clock-in-display cursor-pointer" aria-label={`Edit Clock In time, currently ${clockInTime}`} suppressHydrationWarning title="Edit Clock In time" onClick={() => document.getElementById('clock-in-hidden')?.click()}>{clockInTime || 'Choose time'}</button>
              <div className="mt-2 flex justify-center"><button type="button" onClick={() => document.getElementById('clock-in-now-hidden')?.click()} className="rounded-full border border-border bg-background px-4 py-1.5 text-[9px] font-bold shadow-sm transition hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Play className="mr-1 inline size-2.5" />NOW · {time}</button></div>
            </div>

            <div className="rounded-lg border border-[var(--sif-orange)]/30 bg-[var(--sif-orange)]/5 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--sif-orange)]">Clock Out</span>
                <div className="flex items-center gap-1.5">
                  <Clock3 className="size-3 shrink-0 text-[var(--sif-orange)]" />
                  <button
                    type="button"
                    onClick={copyClockOut}
                    aria-label="Copy clock out time"
                    title="Copy clock out time"
                    className="clock-out-copy relative z-20 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-[var(--sif-orange)]/35 bg-card text-[var(--sif-orange)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sif-orange)]/40"
                  >
                    <Copy className="size-3.5 shrink-0" />
                  </button>
                </div>
              </div>
              <div className="relative mt-1 min-h-8">
                <button type="button" onClick={copyClockOut} title="Copy HH:mm:ss" className="block w-full cursor-pointer text-left">
                  <strong className="block font-mono text-2xl font-bold tabular-nums tracking-[-0.04em] text-[var(--sif-orange)]">{clockOutText}</strong>
                </button>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Shift progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                <div className={`h-full rounded-full transition-[width] duration-500 ${shift.shiftComplete ? 'bg-[var(--sif-green)]' : 'bg-[var(--sif-yellow)]'}`} style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[7px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"><span className={shift.shiftComplete ? 'text-[var(--sif-green)]' : 'text-[var(--sif-yellow)]'}>{progress}% complete</span><span className="text-[var(--sif-yellow)]">01:00:00 break</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 border-b border-border sm:grid-cols-4">
        <DashboardMetric icon={<Activity className="size-3" />} label="Active workloads" value={`${activeWorkloadCount}/${activeWorkloads}`} note={`${totalUnits} total units`} />
        <DashboardMetric icon={<Timer className="size-3" />} label="Work time" value={formatDuration(totalSeconds)} note="Calculated workload" />
        <DashboardMetric icon={<Coffee className="size-3" />} label="Break" value="01:00:00" note="Fixed 1-hour break" />
        <DashboardMetric icon={<TrendingUp className="size-3" />} label="Status" value={status} note="Live shift status" />
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.35fr_.65fr]">
        <div className="min-w-0 border-b border-border p-4 lg:border-b-0 lg:border-r sm:p-5">
          <div className="flex items-end justify-between gap-3"><div><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Workload breakdown</p><h3 className="mt-1 text-sm font-semibold tracking-tight">Where today&apos;s time is going</h3></div><span className="font-mono text-[8px] font-bold text-muted-foreground">{breakdown.length} active</span></div>
          <div className="mt-4 space-y-3">{breakdown.length > 0 ? breakdown.map((item, index) => { const color = workloadColors[index % workloadColors.length]; const share = totalSeconds > 0 ? Math.min(100, Math.round((item.duration / totalSeconds) * 100)) : 0; const width = Math.max(7, Math.round((item.duration / maxDuration) * 100)); return <div key={item.id} className="min-w-0"><div className="flex items-center justify-between gap-3 text-[8px] font-semibold"><div className="flex min-w-0 items-center gap-2"><span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" /><span className="truncate">{item.label}</span><span className="font-mono text-muted-foreground">{item.quantity}</span></div><span className="shrink-0 font-mono tabular-nums text-muted-foreground">{formatDuration(item.duration)} · {share}%</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${width}%`, backgroundColor: color }} /></div></div> }) : <div className="rounded-lg border border-dashed border-border bg-background/30 px-3 py-5 text-center text-[9px] text-muted-foreground">Add workload quantities above to populate the live breakdown.</div>}</div>
        </div>
        <div className="min-w-0 p-4 sm:p-5"><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Shift timeline</p><h3 className="mt-1 text-sm font-semibold tracking-tight">Your workday at a glance</h3><div className="relative mt-5 space-y-4 pl-1"><div className="absolute left-[4px] top-2 bottom-2 w-px bg-border" aria-hidden="true" /><TimelineItem label="Clock In" value={shift.clockInSeconds === null ? '—' : formatMilitaryTime(shift.clockInSeconds)} color="var(--sif-cyan)" /><TimelineItem label="Work complete" value={breakStartSeconds === null ? '—' : formatMilitaryTime(breakStartSeconds)} color="var(--sif-green)" /><TimelineItem label="Break" value={breakStartSeconds === null ? '—' : `${formatMilitaryTime(breakStartSeconds)} → ${formatMilitaryTime(breakEndSeconds)}`} color="var(--sif-yellow)" /><TimelineItem label="Clock Out" value={clockOutText} color="var(--sif-orange)" active={shift.shiftComplete} /></div><p className="mt-5 rounded-lg border border-border bg-background/35 px-3 py-2 text-[8px] leading-4 text-muted-foreground">Timeline uses Clock In + calculated workload time + the fixed 1-hour break.</p></div>
      </div>
      {copied && <div role="status" aria-live="polite" className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"><span className="inline-flex items-center rounded-full border border-[var(--sif-green)]/30 bg-card px-3 py-2 text-[9px] font-bold text-[var(--sif-green)] shadow-lg"><Check className="mr-1.5 size-3" />Copied clock out time</span></div>}
    </section>
  )
}

function DashboardLiveMetric({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) { return <div><span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</span><strong className={`mt-0.5 block font-mono text-xl font-bold tabular-nums ${emphasis ? 'text-primary' : ''}`}>{value}</strong></div> }
function DashboardMetric({ icon, label, value, note }: DashboardMetricProps) { return <div className="min-w-0 border-r border-border px-3 py-3 last:border-r-0 sm:px-4"><div className="flex items-center gap-1.5 text-muted-foreground">{icon}<span className="text-[7px] font-bold uppercase tracking-[0.14em]">{label}</span></div><strong className="mt-1 block truncate font-mono text-sm font-bold tabular-nums tracking-[-0.02em]">{value}</strong><span className="mt-0.5 block truncate text-[7px] text-muted-foreground">{note}</span></div> }
function TimelineItem({ label, value, color, active }: { label: string; value: string; color: string; active?: boolean }) { return <div className="relative flex items-start gap-3"><div className="relative z-10 flex w-3 shrink-0 justify-center"><span className="mt-1.5 size-2 rounded-full border-2 border-card ring-1" style={{ backgroundColor: color, boxShadow: `0 0 0 1px color-mix(in srgb, ${color} 25%, transparent)` }} /></div><div className="min-w-0 flex-1"><span className="block text-[7px] font-bold uppercase tracking-[0.14em]" style={{ color }}>{label}</span><strong className={`mt-0.5 block truncate font-mono text-[11px] font-bold tabular-nums ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{value}</strong></div></div> }
type BreakdownItem = { id: string; label: string; duration: number; quantity: number }
