'use client'

import { Activity, Clock3, Coffee, Timer } from 'lucide-react'
import { formatDuration, formatMilitaryTime } from '@/lib/calculator'
import { calculateShift } from '@/lib/shift'
import { usePhilippineClock } from '@/lib/use-philippine-clock'

const cardClass = 'rounded-xl border border-border bg-card/80 shadow-[0_8px_28px_var(--card-shadow)] backdrop-blur'

type Props = {
  totalSeconds: number
  totalUnits: number
  activeWorkloads: number
  clockInTime: string
}

export function TodaySnapshot({ totalSeconds, totalUnits, activeWorkloads, clockInTime }: Props) {
  const { seconds: nowSeconds } = usePhilippineClock()
  const shift = calculateShift(clockInTime, totalSeconds, totalUnits, nowSeconds)
  const status = shift.shiftStatus
  const statusClass = shift.shiftComplete ? 'bg-[var(--sif-green)]/10 text-[var(--sif-green)]' : totalUnits > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'

  return (
    <section aria-label="Today snapshot" className={`${cardClass} mb-4 p-3.5 sm:p-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Activity className="size-3.5" /></div>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Today Snapshot</p>
            <p className="mt-0.5 text-[10px] font-semibold text-foreground">Live shift overview</p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.12em] ${statusClass}`}>
          {status}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SnapshotMetric icon={<Activity className="size-3" />} label="Workloads" value={`${activeWorkloads} / 5`} note={`${totalUnits} total units`} />
        <SnapshotMetric icon={<Timer className="size-3" />} label="Work time" value={formatDuration(totalSeconds)} note="Calculated workload" />
        <SnapshotMetric icon={<Coffee className="size-3" />} label="Break" value="01:00:00" note="Fixed 1-hour break" />
        <SnapshotMetric icon={<Clock3 className="size-3" />} label="Clock out" value={formatMilitaryTime(shift.estimatedClockOutSeconds)} note={shift.estimatedClockOutSeconds === null ? 'Add workload' : shift.shiftComplete ? 'Shift complete' : `${formatDuration(shift.timeLeftSeconds)} remaining`} />
      </div>
    </section>
  )
}

function SnapshotMetric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-background/45 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[7px] font-bold uppercase tracking-[0.14em]">{label}</span>
      </div>
      <strong className="mt-1 block truncate font-mono text-sm font-bold tabular-nums tracking-[-0.02em]">{value}</strong>
      <span className="mt-0.5 block truncate text-[7px] text-muted-foreground">{note}</span>
    </div>
  )
}
