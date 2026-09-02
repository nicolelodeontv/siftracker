import { DEFAULT_RATES, validateRates, WORKLOAD_CONFIG_VERSION } from '@/lib/workloads'

export const RATE_STORAGE_KEY = 'sif-tracker-rates-v2'
const LEGACY_RATE_STORAGE_KEY = 'sif-tracker-rates-v1'

type RateStorage = {
  version: number
  rates: Record<string, number>
}

function parseStored(value: string | null): Record<string, number> | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as Partial<RateStorage>
    return validateRates(parsed?.rates)
  } catch {
    return null
  }
}

export function loadSavedRates(): Record<string, number> {
  if (typeof window === 'undefined') return { ...DEFAULT_RATES }

  const current = parseStored(window.localStorage.getItem(RATE_STORAGE_KEY))
  if (current) return current

  const legacy = parseStored(window.localStorage.getItem(LEGACY_RATE_STORAGE_KEY))
  if (legacy) {
    persistSavedRates(legacy)
    return legacy
  }

  return { ...DEFAULT_RATES }
}

export function persistSavedRates(rates: Record<string, number>) {
  if (typeof window === 'undefined') return false
  const validated = validateRates(rates)
  if (!validated) return false

  try {
    const payload: RateStorage = {
      version: WORKLOAD_CONFIG_VERSION,
      rates: validated,
    }
    window.localStorage.setItem(RATE_STORAGE_KEY, JSON.stringify(payload))
    return true
  } catch {
    return false
  }
}
