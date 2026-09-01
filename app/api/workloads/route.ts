import { NextResponse } from 'next/server'
import { DEFAULT_RATES, DEFAULT_WORKLOADS, validateRates, WORKLOAD_CONFIG_VERSION } from '@/lib/workloads'

export function GET() {
  return NextResponse.json({
    version: WORKLOAD_CONFIG_VERSION,
    workloads: DEFAULT_WORKLOADS,
    rates: DEFAULT_RATES,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rates = validateRates(body?.rates)
    if (!rates) {
      return NextResponse.json({ error: 'Invalid workload rates.' }, { status: 400 })
    }

    return NextResponse.json({
      version: WORKLOAD_CONFIG_VERSION,
      rates,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }
}
