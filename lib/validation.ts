export const MIN_RATE_MINUTES = 1
export const MAX_RATE_MINUTES = 240
export const MAX_INPUT_LENGTH = 200

export function clampRate(value: number) {
  return Math.max(MIN_RATE_MINUTES, Math.min(MAX_RATE_MINUTES, Math.round(value)))
}

export function validateRates(rates: Record<string, number>, ids: readonly string[]) {
  for (const id of ids) {
    const value = rates[id]
    if (!Number.isFinite(value) || value < MIN_RATE_MINUTES || value > MAX_RATE_MINUTES) return false
  }
  return true
}

export function isValidWorkloadInput(value: string) {
  return value.length <= MAX_INPUT_LENGTH && /^[\d+*/().=\s-]*$/.test(value)
}
