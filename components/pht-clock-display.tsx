'use client'

import { usePhilippineClock } from '@/lib/use-philippine-clock'

export function PhtClockDisplay() {
  const { time, date } = usePhilippineClock()

  return (
    <div className="text-right leading-tight" aria-label={`Current Philippine date and time ${date} ${time}`}>
      <span className="block whitespace-nowrap text-[8px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-[9px]">
        Philippine Standard Time
      </span>
      <time className="block whitespace-nowrap font-mono text-[9px] font-bold tabular-nums sm:text-[10px]" dateTime={`1970-01-01T${time}`}>
        {date} · {time}
      </time>
    </div>
  )
}
