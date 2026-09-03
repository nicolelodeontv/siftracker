'use client'

import { useEffect, useState } from 'react'

type PhilippineClock = {
  time: string
  date: string
  seconds: number
}

const TIME_ZONE = 'Asia/Manila'

function getParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  return Object.fromEntries(parts.map(({ type, value }) => [type, value])) as Record<string, string>
}

export function getCurrentClockIn() {
  const parts = getParts(new Date())
  return `${parts.hour}:${parts.minute}:${parts.second}`
}

function readClock(date = new Date()): PhilippineClock {
  const parts = getParts(date)
  const hour = Number(parts.hour)
  const minute = Number(parts.minute)
  const second = Number(parts.second)

  return {
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
    date: new Intl.DateTimeFormat('en-PH', {
      timeZone: TIME_ZONE,
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).format(date),
    seconds: hour * 3600 + minute * 60 + second,
  }
}

export function usePhilippineClock() {
  // Start empty so SSR never invents a historical date/time. The live PHT
  // value is populated immediately after hydration and then refreshed each second.
  const [clock, setClock] = useState<PhilippineClock | null>(null)

  useEffect(() => {
    const tick = () => setClock(readClock())
    tick()
    const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  }, [])

  return clock ?? { time: '--:--:--', date: 'Loading…', seconds: 0 }
}
