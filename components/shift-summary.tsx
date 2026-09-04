'use client'

import type { RefObject } from 'react'

type Props = {
  totalSeconds: number
  totalUnits: number
  clockInTime: string
  shiftRef?: RefObject<HTMLElement | null>
  onClockInChange: (value: string) => void
  onSetClockInNow: (value: string) => void
  onCopyClockOut: (value: string) => void
}

/** Retired: shift status and Clock In/Out now live in Dashboard / Live Shift. */
export function ShiftSummary(_props: Props) {
  return null
}
