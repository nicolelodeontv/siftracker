import { NextResponse } from 'next/server'
import { DEFAULT_RATES, DEFAULT_WORKLOADS, WORKLOAD_CONFIG_VERSION } from '@/lib/workloads'

export function GET() {
  return NextResponse.json({
    ok: true,
    service: 'sif-tracker-workloads',
    configVersion: WORKLOAD_CONFIG_VERSION,
    rates: DEFAULT_RATES,
    workloads: DEFAULT_WORKLOADS,
  })
}

