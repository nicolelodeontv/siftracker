import { calculateValue, getElapsedSeconds, timeToSeconds } from '@/lib/calculator'
import type { Workload } from '@/lib/workloads'

export const BREAK_SECONDS = 60 * 60

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

/**
 * Calculate shift progress using an absolute clock-in timestamp when available.
 * This avoids the 24-hour wrap in getElapsedSeconds() for unusually long shifts.
 * The legacy wall-clock fallback remains for callers that only have HH:mm:ss.
 */
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
        : getElapsedSeconds(clockInSeconds, nowSeconds)

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
