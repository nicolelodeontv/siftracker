'use client'

import { memo, useEffect, useRef } from 'react'
import { formatPhilippineDate, formatPhilippineTime, getCurrentClockIn, type TimeFormat } from '@/lib/use-philippine-clock'

type Props = {
  timeFormat: TimeFormat
}

export const PhtClockDisplay = memo(function PhtClockDisplay({ timeFormat }: Props) {
  const dateRef = useRef<HTMLSpanElement>(null)
  const timeRef = useRef<HTMLTimeElement>(null)

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      if (dateRef.current) dateRef.current.textContent = formatPhilippineDate(now)
      if (timeRef.current) timeRef.current.textContent = formatPhilippineTime(getCurrentClockIn(), timeFormat)
    }

    tick()
    const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  }, [timeFormat])

  return (
    <div
      className="pht-clock-display min-w-0 text-right leading-tight"
      aria-label="Philippine Standard Time"
    >
      <span className="block whitespace-nowrap text-[7px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:text-[8px] sm:tracking-[0.16em]">
        Philippine Standard Time
      </span>
      <time
        ref={timeRef}
        className="block whitespace-nowrap font-mono text-[8px] font-bold tabular-nums sm:text-[10px]"
        suppressHydrationWarning
      >
        --:--:--
      </time>
    </div>
  )
})
