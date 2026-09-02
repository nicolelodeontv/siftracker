'use client'

import { usePhilippineClock } from '@/lib/use-philippine-clock'

export function PhtClockDisplay() {
  const { time } = usePhilippineClock()

  return (
    <div className="text-right" aria-label={`Current Philippine time ${time}`}>
      <span className="hidden text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:block">PHT Now</span>
      <time className="block whitespace-nowrap font-mono text-[9px] font-bold tabular-nums sm:text-[10px]" dateTime={`1970-01-01T${time}`}>{time}</time>
    </div>
  )
}
