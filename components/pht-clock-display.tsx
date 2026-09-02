'use client'

import { usePhilippineClock } from '@/lib/use-philippine-clock'

export function PhtClockDisplay() {
  const { time, date } = usePhilippineClock()

  return (
    <div className="text-right leading-tight" aria-label={`Current Philippine date and time ${date} ${time}`}>
      <span className="hidden text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:block">PHT</span>
      <time className="block whitespace-nowrap font-mono text-[9px] font-bold tabular-nums sm:text-[10px]" dateTime={`1970-01-01T${time}`}>
        {time}
      </time>
      <span className="block whitespace-nowrap font-mono text-[8px] font-medium text-muted-foreground sm:text-[9px]">{date}</span>
    </div>
  )
}
