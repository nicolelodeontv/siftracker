import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({
    ok: true,
    service: 'sif-tracker',
    timestamp: new Date().toISOString(),
  })
}
