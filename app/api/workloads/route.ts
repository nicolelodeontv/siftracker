import { NextResponse } from 'next/server'
import { DEFAULT_RATES, DEFAULT_WORKLOADS, validateRates, WORKLOAD_CONFIG_VERSION } from '@/lib/workloads'

export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json(
    {
      version: WORKLOAD_CONFIG_VERSION,
      workloads: DEFAULT_WORKLOADS,
      rates: DEFAULT_RATES,
    },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  )
}

export async function POST(request: Request) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415 })
    }

    const body: unknown = await request.json()
    const rates = validateRates(
      body && typeof body === 'object' && !Array.isArray(body)
        ? (body as Record<string, unknown>).rates
        : null,
    )

    if (!rates) {
      return NextResponse.json({ error: 'Invalid workload rates.' }, { status: 400 })
    }

    return NextResponse.json(
      {
        version: WORKLOAD_CONFIG_VERSION,
        rates,
      },
      {
        headers: { 'Cache-Control': 'no-store' },
      },
    )
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }
}
