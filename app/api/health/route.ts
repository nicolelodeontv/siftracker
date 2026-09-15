import { NextResponse } from 'next/server'
import { DEFAULT_RATES, DEFAULT_WORKLOADS, validateRates } from '@/lib/workloads'

export function GET() {
  const validRates = validateRates(DEFAULT_RATES)
  const configLoaded =
    DEFAULT_WORKLOADS.length > 0 &&
    validRates !== null &&
    Object.keys(validRates).length === DEFAULT_WORKLOADS.length

  return NextResponse.json(
    {
      ok: configLoaded,
      service: 'sif-tracker',
      checks: {
        workloadConfig: configLoaded ? 'ok' : 'error',
        workloadCount: DEFAULT_WORKLOADS.length,
      },
      timestamp: new Date().toISOString(),
    },
    { status: configLoaded ? 200 : 503 },
  )
}
