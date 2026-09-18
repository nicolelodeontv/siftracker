'use client'

import { memo, useEffect, useRef } from 'react'
import { formatPhilippineTime, getCurrentClockIn, type TimeFormat } from '@/lib/use-philippine-clock'

type Props = {
  timeFormat: TimeFormat
}

export const PhtLiveTime = memo(function PhtLiveTime({ timeFormat }: Props) {
  const timeRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const tick = () => {
      if (timeRef.current) timeRef.current.textContent = formatPhilippineTime(getCurrentClockIn(), timeFormat)
    }

    tick()
    const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  }, [timeFormat])

  return (
    <span ref={timeRef} suppressHydrationWarning>
      --:--:--
    </span>
  )
})
