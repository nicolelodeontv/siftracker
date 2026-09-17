export type Workload = {
  id: string
  label: string
  unit: 'teams' | 'indis' | 'orders'
  minutesPerUnit: number
  accent: string
}

export const DEFAULT_WORKLOADS: Workload[] = [
  { id: 'teamEdit', label: 'Team edit', unit: 'teams', minutesPerUnit: 15, accent: 'var(--primary)' },
  { id: 'indiClip', label: 'Indi clip', unit: 'indis', minutesPerUnit: 5, accent: 'var(--primary)' },
  { id: 'indiEdit', label: 'Indi edit', unit: 'indis', minutesPerUnit: 5, accent: 'var(--primary)' },
  { id: 'indiBuild', label: 'Indi build', unit: 'orders', minutesPerUnit: 4, accent: 'var(--primary)' },
  { id: 'lateOrders', label: 'Late orders', unit: 'orders', minutesPerUnit: 15, accent: 'var(--primary)' },
]

export const DEFAULT_RATES = Object.fromEntries(
  DEFAULT_WORKLOADS.map(({ id, minutesPerUnit }) => [id, minutesPerUnit]),
) as Record<string, number>

export const WORKLOAD_CONFIG_VERSION = 2

export function validateRates(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  const source = input as Record<string, unknown>
  const next: Record<string, number> = {}

  for (const workload of DEFAULT_WORKLOADS) {
    const raw = source[workload.id]
    if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 1 || raw > 240) return null
    const rate = raw
    next[workload.id] = Math.round(rate)
  }

  return next
}
