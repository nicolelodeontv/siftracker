import { NextResponse } from 'next/server'
import {
  DEFAULT_RATES,
  DEFAULT_WORKLOADS,
  WORKLOAD_CONFIG_VERSION,
  validateRates,
} from '@/lib/workloads'

export function GET() {
  return NextResponse.json({
    ok: true,
    service: 'sif-tracker-workloads',
    configVersion: WORKLOAD_CONFIG_VERSION,
    rates: DEFAULT_RATES,
    workloads: DEFAULT_WORKLOADS,
  })
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON request body.' },
      { status: 400 },
    )
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json(
      { ok: false, error: 'Request body must be an object containing a "rates" object.' },
      { status: 400 },
    )
  }

  const rawRates = (body as Record<string, unknown>).rates
  if (!rawRates || typeof rawRates !== 'object' || Array.isArray(rawRates)) {
    return NextResponse.json(
      { ok: false, error: 'Missing required "rates" object.' },
      { status: 400 },
    )
  }

  const rates = validateRates(rawRates)
  if (!rates) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Invalid rates. Every workload rate must be a number from 1 to 240 minutes, with no missing fields.',
      },
      { status: 400 },
    )
  }

  return NextResponse.json({
    ok: true,
    service: 'sif-tracker-workloads',
    configVersion: WORKLOAD_CONFIG_VERSION,
    rates,
  })
}
