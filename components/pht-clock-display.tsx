'use client'

import { usePhilippineClock } from '@/lib/use-philippine-clock'

export function PhtClockDisplay() {
  const { time, date } = usePhilippineClock()
  const isLoading = time === '--:--:--'

  return (
    <div
      className="pht-clock-display min-w-0 text-right leading-tight"
      aria-label={isLoading ? 'Philippine Standard Time loading' : `Current Philippine date and time ${date} ${time}`}
    >
      <span className="block whitespace-nowrap text-[7px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:text-[8px] sm:tracking-[0.16em]">
        Philippine Standard Time
      </span>
      <time
        className="block whitespace-nowrap font-mono text-[8px] font-bold tabular-nums sm:text-[10px]"
        dateTime={isLoading ? undefined : undefined}
        suppressHydrationWarning
      >
        {date} · {time}
      </time>
    </div>
  )
}
