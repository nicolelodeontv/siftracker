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

export function getExampleAmounts(workload: Workload) {
  if (workload.unit === 'teams') return [1, 4, 16, 32]
  if (workload.unit === 'indis') return [1, 12, 48, 96]
  return [1, 15, 60, 120]
}

export function getUnitLabel(unit: Workload['unit'], amount: number) {
  const singular = unit.slice(0, -1)
  return `${amount} ${amount === 1 ? singular : unit}`
}

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
