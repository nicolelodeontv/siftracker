'use client'

import { usePhilippineClock } from '@/lib/use-philippine-clock'

export function PhtClockDisplay() {
  const { time, date } = usePhilippineClock()

  return (
    <div
      className="pht-clock-display min-w-0 text-right leading-tight"
      aria-label={`Current Philippine date and time ${date} ${time}`}
      suppressHydrationWarning
    >
      <span className="block whitespace-nowrap text-[7px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:text-[8px] sm:tracking-[0.16em]">
        Philippine Standard Time
      </span>
      <time
        className="block whitespace-nowrap font-mono text-[8px] font-bold tabular-nums sm:text-[10px]"
        dateTime={`1970-01-01T${time}`}
        suppressHydrationWarning
      >
        {date} · {time}
      </time>
    </div>
  )
}
