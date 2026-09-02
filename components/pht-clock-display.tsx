'use client'

import { usePhilippineClock } from '@/lib/use-philippine-clock'

export function PhtClockDisplay() {
  const { time } = usePhilippineClock()

  return (
    <div className="hidden text-right sm:block" aria-label={`Current Philippine time ${time}`}>
      <span className="block text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">PHT Now</span>
      <time className="block font-mono text-[10px] font-bold tabular-nums" dateTime={time}>{time}</time>
    </div>
  )
}
