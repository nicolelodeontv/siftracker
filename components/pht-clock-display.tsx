'use client'

import { usePhilippineClock } from '@/lib/use-philippine-clock'

export function PhtClockDisplay() {
  const { time, date } = usePhilippineClock()

  return (
    <div
      className="min-w-0 text-right leading-tight"
      aria-label={`Current Philippine date and time ${date} ${time}`}
    >
      <span className="block max-w-[150px] truncate text-[7px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:max-w-none sm:text-[8px] sm:tracking-[0.16em]">
        Philippine Standard Time
      </span>
      <time
        className="block whitespace-nowrap font-mono text-[8px] font-bold tabular-nums sm:text-[10px]"
        dateTime={`1970-01-01T${time}`}
      >
        {date} · {time}
      </time>
    </div>
  )
}
