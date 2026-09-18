'use client'

import { useEffect, useState } from 'react'

export type TimeFormat = '24h' | '12h'

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

export function formatPhilippineTime(time: string, timeFormat: TimeFormat = '24h') {
  const match = /^(\\d{2}):(\\d{2}):(\\d{2})$/.exec(time)
  if (!match) return time

  const hours24 = Number(match[1])
  const minutes = match[2]
  const seconds = match[3]

  if (timeFormat === '24h') return `${match[1]}:${minutes}:${seconds}`

  const period = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 || 12
  return `${hours12}:${minutes}:${seconds} ${period}`
}

export function formatPhilippineDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: TIME_ZONE,
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date)
}

function readClock(date = new Date()): PhilippineClock {
  const parts = getParts(date)
  const hour = Number(parts.hour)
  const minute = Number(parts.minute)
  const second = Number(parts.second)

  return {
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
    date: formatPhilippineDate(date),
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
