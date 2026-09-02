export type Workload = {
  id: string
  label: string
  unit: 'teams' | 'indis' | 'orders'
  minutesPerUnit: number
  accent: string
}

export const DEFAULT_WORKLOADS: Workload[] = [
  { id: 'teamEdit', label: 'Team edit', unit: 'teams', minutesPerUnit: 15, accent: 'var(--chart-1)' },
  { id: 'indiClip', label: 'Indi clip', unit: 'indis', minutesPerUnit: 5, accent: 'var(--chart-2)' },
  { id: 'indiEdit', label: 'Indi edit', unit: 'indis', minutesPerUnit: 5, accent: 'var(--chart-3)' },
  { id: 'indiBuild', label: 'Indi build', unit: 'orders', minutesPerUnit: 4, accent: 'var(--chart-4)' },
  { id: 'lateOrders', label: 'Late orders', unit: 'orders', minutesPerUnit: 15, accent: 'var(--chart-5)' },
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
    const rate = typeof raw === 'number' ? raw : Number(raw)
    if (!Number.isFinite(rate) || rate < 1 || rate > 240) return null
    next[workload.id] = Math.round(rate)
  }

  return next
}
