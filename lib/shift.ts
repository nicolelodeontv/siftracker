import { calculateValue, getElapsedSeconds, timeToSeconds } from '@/lib/calculator'
import type { Workload } from '@/lib/workloads'

export const BREAK_SECONDS = 60 * 60
const PHT_OFFSET_MS = 8 * 60 * 60 * 1000
const OVERNIGHT_THRESHOLD_SECONDS = 12 * 60 * 60

export type CalculatedWorkload = {
  workload: Workload
  input: string
  value: number | null
}

export function calculateWorkloads(workloads: Workload[], values: Record<string, string>) {
  const calculatedValues = workloads.map((workload) => ({
    workload,
    input: values[workload.id] ?? '',
    value: calculateValue(values[workload.id] ?? ''),
  }))
  const totalSeconds = calculatedValues.reduce(
    (total, { workload, value }) => total + Math.max(0, value ?? 0) * workload.minutesPerUnit * 60,
    0,
  )
  const totalUnits = calculatedValues.reduce((total, { value }) => total + Math.max(0, value ?? 0), 0)
  return { calculatedValues, totalSeconds, totalUnits }
}

function getPhilippineDateParts(timestampMs: number) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(timestampMs))
  return Object.fromEntries(parts.map(({ type, value }) => [type, value])) as Record<string, string>
}

function inferClockInTimestampMs(clockInSeconds: number, nowSeconds: number, nowTimestampMs: number) {
  const parts = getPhilippineDateParts(nowTimestampMs)
  const year = Number(parts.year)
  const month = Number(parts.month)
  const day = Number(parts.day)
  const nowUtcEquivalent = Date.UTC(year, month - 1, day, 0, 0, 0)
  const shouldUsePreviousDay = clockInSeconds > nowSeconds + OVERNIGHT_THRESHOLD_SECONDS
  const dayOffset = shouldUsePreviousDay ? 1 : 0
  const clockInUtcEquivalent = nowUtcEquivalent + clockInSeconds * 1000 - dayOffset * 24 * 60 * 60 * 1000
  return clockInUtcEquivalent - PHT_OFFSET_MS
}

export function calculateShift(
  clockInTime: string,
  totalSeconds: number,
  totalUnits: number,
  nowSeconds: number,
  clockInTimestampMs?: number,
  nowTimestampMs: number = Date.now(),
) {
  const clockInSeconds = timeToSeconds(clockInTime)
  const shiftSeconds = totalUnits > 0 ? totalSeconds + BREAK_SECONDS : 0
  const estimatedClockOutSeconds = clockInSeconds === null || totalUnits === 0 ? null : clockInSeconds + shiftSeconds

  const elapsedShiftSeconds =
    clockInSeconds === null
      ? 0
      : clockInTimestampMs !== undefined && Number.isFinite(clockInTimestampMs) && Number.isFinite(nowTimestampMs)
        ? Math.max(0, Math.floor((nowTimestampMs - clockInTimestampMs) / 1000))
        : Math.max(0, Math.floor((nowTimestampMs - inferClockInTimestampMs(clockInSeconds, nowSeconds, nowTimestampMs)) / 1000))

  const shiftComplete = estimatedClockOutSeconds !== null && elapsedShiftSeconds >= shiftSeconds
  const timeLeftSeconds = estimatedClockOutSeconds === null || shiftComplete ? 0 : Math.max(0, shiftSeconds - elapsedShiftSeconds)
  const shiftStatus = totalUnits === 0 ? 'NOT STARTED' : shiftComplete ? 'SHIFT COMPLETE' : 'IN PROGRESS'
  return {
    clockInSeconds,
    shiftSeconds,
    estimatedClockOutSeconds,
    elapsedShiftSeconds,
    shiftComplete,
    timeLeftSeconds,
    shiftStatus,
  }
}
