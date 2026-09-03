export type ParsedWorkload = {
  value: number | null
  incomplete: boolean
}

export const DAY_SECONDS = 24 * 60 * 60

export function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remaining = seconds % 60
  return [hours, minutes, remaining].map((value) => String(value).padStart(2, '0')).join(':')
}

export function formatCompactDuration(totalMinutes: number) {
  const minutes = Math.max(0, Math.round(totalMinutes))
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  if (hours === 0) return `${remaining}m`
  if (remaining === 0) return `${hours}h`
  return `${hours}h ${remaining}m`
}

export function formatMilitaryTime(totalSeconds: number | null) {
  if (totalSeconds === null) return '—'
  const daySeconds = ((Math.round(totalSeconds) % DAY_SECONDS) + DAY_SECONDS) % DAY_SECONDS
  const hours24 = Math.floor(daySeconds / 3600)
  const minutes = Math.floor((daySeconds % 3600) / 60)
  const seconds = daySeconds % 60
  return `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function calculateValue(value: string): number | null {
  const normalized = value.replace(/\s+/g, '')
  if (!normalized || normalized.length > 200 || !/^[\d+*/().=-]+$/.test(normalized)) return null

  const parts = normalized.split('=')
  if (parts.length > 2 || !parts[0] || normalized.endsWith('=')) return null

  const [expression, declaredTotal] = parts
  const tokens = expression.match(/\d+(?:\.\d+)?|[()+*/-]/g) ?? []
  if (tokens.join('') !== expression) return null

  try {
    const index = { value: 0 }

    const parseExpression = (): number => {
      let result = parseTerm()
      while (tokens[index.value] === '+' || tokens[index.value] === '-') {
        const operator = tokens[index.value++]
        const next = parseTerm()
        result = operator === '+' ? result + next : result - next
      }
      return result
    }

    const parseTerm = (): number => {
      let result = parseFactor()
      while (tokens[index.value] === '*' || tokens[index.value] === '/') {
        const operator = tokens[index.value++]
        const next = parseFactor()
        if (operator === '/' && next === 0) throw new Error('Division by zero')
        result = operator === '*' ? result * next : result / next
      }
      return result
    }

    const parseFactor = (): number => {
      const token = tokens[index.value++]
      if (token === '(') {
        const result = parseExpression()
        if (tokens[index.value++] !== ')') throw new Error('Unclosed parenthesis')
        return result
      }
      if (token === '-') return -parseFactor()
      if (!token || Number.isNaN(Number(token))) throw new Error('Invalid expression')
      return Number(token)
    }

    const result = parseExpression()
    if (index.value !== tokens.length || !Number.isFinite(result) || Math.abs(result) > 1_000_000) return null

    const rounded = Number.isInteger(result) ? result : Number(result.toFixed(2))
    return declaredTotal !== undefined && Number(declaredTotal) !== rounded ? null : rounded
  } catch {
    return null
  }
}

export function isIncompleteExpression(value: string) {
  const normalized = value.trim()
  if (!normalized) return false
  return /(?:[+*/.=(-]|\s)$/.test(normalized) || /^(?:[-+]|\()$/.test(normalized)
}

export function timeToSeconds(value: string) {
  const match = /^(\d{2}):(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])
  const seconds = Number(match[3])
  if (hours > 23 || minutes > 59 || seconds > 59) return null
  return hours * 3600 + minutes * 60 + seconds
}

export function getElapsedSeconds(clockInSeconds: number, nowSeconds: number) {
  return ((nowSeconds - clockInSeconds) + DAY_SECONDS) % DAY_SECONDS
}
