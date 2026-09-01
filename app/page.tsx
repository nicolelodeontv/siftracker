'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, Minus, Plus, RotateCcw, Settings2, TimerReset, X } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

type Workload = {
  id: string
  label: string
  unit: string
  minutesPerUnit: number
  accent: string
}

type RateMap = Record<string, number>
type Feedback = 'saved' | 'reset' | 'copied' | null

const DEFAULT_WORKLOADS: Workload[] = [
  { id: 'teamEdit', label: 'Team edit', unit: 'teams', minutesPerUnit: 15, accent: 'var(--chart-1)' },
  { id: 'indiClip', label: 'Indi clip', unit: 'indis', minutesPerUnit: 5, accent: 'var(--chart-2)' },
  { id: 'indiEdit', label: 'Indi edit', unit: 'indis', minutesPerUnit: 5, accent: 'var(--chart-3)' },
  { id: 'indiBuild', label: 'Indi build', unit: 'orders', minutesPerUnit: 4, accent: 'var(--chart-4)' },
  { id: 'lateOrders', label: 'Late orders', unit: 'orders', minutesPerUnit: 15, accent: 'var(--chart-5)' },
]

const EMPTY_VALUES = Object.fromEntries(DEFAULT_WORKLOADS.map(({ id }) => [id, '']))
const DEFAULT_RATES: RateMap = Object.fromEntries(DEFAULT_WORKLOADS.map(({ id, minutesPerUnit }) => [id, minutesPerUnit]))
const TIME_ZONE = 'Asia/Manila'
const STORAGE_KEY = 'sif-tracker-rates-v1'
const BREAK_SECONDS = 60 * 60

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remaining = seconds % 60
  return [hours, minutes, remaining].map((value) => String(value).padStart(2, '0')).join(':')
}

function formatCompactDuration(totalMinutes: number) {
  const minutes = Math.max(0, Math.round(totalMinutes))
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  if (hours === 0) return `${remaining}m`
  if (remaining === 0) return `${hours}h`
  return `${hours}h ${remaining}m`
}

function getExampleAmounts(workload: Workload) {
  if (workload.unit === 'teams') return [1, 4, 16, 32]
  if (workload.unit === 'indis') return [1, 12, 48, 96]
  return [1, 15, 60, 120]
}

function getUnitLabel(unit: string, amount: number) {
  const singular = unit.slice(0, -1)
  return `${amount} ${amount === 1 ? singular : unit}`
}

function getPhilippineParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  return Object.fromEntries(parts.map(({ type, value }) => [type, value])) as Record<string, string>
}

function formatPhilippineDate(date: Date) {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: TIME_ZONE,
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatPhilippineTime(date: Date) {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  }).format(date)
}

function formatMilitaryTime(totalSeconds: number | null) {
  if (totalSeconds === null) return '—'
  const daySeconds = ((Math.round(totalSeconds) % 86400) + 86400) % 86400
  const hours = Math.floor(daySeconds / 3600)
  const minutes = Math.floor((daySeconds % 3600) / 60)
  const seconds = daySeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function calculateValue(value: string): number | null {
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

function getCurrentClockIn() {
  const parts = getPhilippineParts(new Date())
  return `${parts.hour}:${parts.minute}:${parts.second}`
}

function timeToSeconds(value: string) {
  const match = /^(\d{2}):(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  const seconds = Number(match[3])
  if (hours > 23 || minutes > 59 || seconds > 59) return null
  return hours * 3600 + minutes * 60 + seconds
}

function normalizeClockValue(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 6)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}:${digits.slice(2)}`
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}:${digits.slice(4)}`
}

export default function Page() {
  const [values, setValues] = useState<Record<string, string>>({ ...EMPTY_VALUES })
  const [rates, setRates] = useState<RateMap>({ ...DEFAULT_RATES })
  const [savedRates, setSavedRates] = useState<RateMap>({ ...DEFAULT_RATES })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [clockInTime, setClockInTime] = useState('09:00:00')
  const [philippineTime, setPhilippineTime] = useState('00:00:00')
  const [philippineDate, setPhilippineDate] = useState('Jan 01, 1970')
  const [focusMode, setFocusMode] = useState(false)
  const [editingRate, setEditingRate] = useState<string | null>(null)
  const [rateDraft, setRateDraft] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setPhilippineTime(formatPhilippineTime(now))
      setPhilippineDate(formatPhilippineDate(now))
    }
    setClockInTime(getCurrentClockIn())
    updateClock()
    const interval = window.setInterval(updateClock, 1000)
    const frame = window.requestAnimationFrame(() => setMounted(true))
    return () => {
      window.clearInterval(interval)
      window.cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')
      if (saved?.rates) {
        const merged = { ...DEFAULT_RATES, ...saved.rates }
        setRates(merged)
        setSavedRates(merged)
      }
    } catch {
      // Ignore invalid local storage.
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ rates: savedRates }))
    } catch {
      // Ignore unavailable local storage.
    }
  }, [savedRates])

  useEffect(() => {
    if (!feedback) return
    const timeout = window.setTimeout(() => setFeedback(null), 1800)
    return () => window.clearTimeout(timeout)
  }, [feedback])

  useEffect(() => {
    if (!confirmReset) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setConfirmReset(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [confirmReset])

  const workloads = useMemo(
    () => DEFAULT_WORKLOADS.map((workload) => ({ ...workload, minutesPerUnit: rates[workload.id] ?? workload.minutesPerUnit })),
    [rates],
  )

  const calculatedValues = useMemo(
    () => workloads.map((workload) => ({ workload, value: calculateValue(values[workload.id] ?? '') })),
    [workloads, values],
  )

  const totalSeconds = useMemo(
    () => calculatedValues.reduce((total, { workload, value }) => total + Math.max(0, value ?? 0) * workload.minutesPerUnit * 60, 0),
    [calculatedValues],
  )

  const totalUnits = useMemo(
    () => calculatedValues.reduce((total, { value }) => total + Math.max(0, value ?? 0), 0),
    [calculatedValues],
  )

  const clockInSeconds = timeToSeconds(clockInTime)
  const estimatedClockOutSeconds = clockInSeconds === null || totalUnits === 0
    ? null
    : clockInSeconds + totalSeconds + BREAK_SECONDS

  const unsavedRates = useMemo(
    () => DEFAULT_WORKLOADS.some(({ id }) => rates[id] !== savedRates[id]),
    [rates, savedRates],
  )

  const motion = mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
  const validClockIn = clockInSeconds !== null

  function updateValue(id: string, value: string) {
    if (/^[\d+*/().=\s-]*$/.test(value)) setValues((current) => ({ ...current, [id]: value }))
  }

  function adjustQuantity(id: string, delta: number) {
    const current = calculateValue(values[id] ?? '') ?? 0
    const next = Math.max(0, Math.round((current + delta) * 100) / 100)
    setValues((currentValues) => ({ ...currentValues, [id]: String(next) }))
  }

  function adjustRate(id: string, delta: number) {
    setRates((current) => ({ ...current, [id]: Math.max(1, Math.min(240, (current[id] ?? DEFAULT_RATES[id]) + delta)) }))
  }

  function beginRateEdit(id: string) {
    setEditingRate(id)
    setRateDraft(String(rates[id] ?? DEFAULT_RATES[id]))
  }

  function commitRateEdit(id: string) {
    const parsed = Number(rateDraft.replace(/m/gi, '').trim())
    if (Number.isFinite(parsed)) setRates((current) => ({ ...current, [id]: Math.max(1, Math.min(240, Math.round(parsed))) }))
    setEditingRate(null)
    setRateDraft('')
  }

  function saveRates() {
    setSavedRates({ ...rates })
    setSettingsOpen(false)
    setFeedback('saved')
  }

  function resetRates() {
    const defaults = { ...DEFAULT_RATES }
    setRates(defaults)
    setSavedRates(defaults)
    setFeedback('saved')
  }

  function performReset() {
    setValues({ ...EMPTY_VALUES })
    setClockInTime(getCurrentClockIn())
    setConfirmReset(false)
    setFeedback('reset')
  }

  function applyClockPreset(value: string) {
    setClockInTime(value === 'now' ? getCurrentClockIn() : `${value}:00`)
  }

  function handleClockInput(value: string) {
    const formatted = normalizeClockValue(value)
    if (formatted.length === 8 && timeToSeconds(formatted) !== null) setClockInTime(formatted)
    else if (formatted.length < 8) setClockInTime(formatted)
  }

  async function copySummary() {
    const summary = `Clock In ${clockInTime} · Worked ${formatDuration(totalSeconds)} · Break 01:00:00 · Clock Out ${formatMilitaryTime(estimatedClockOutSeconds)}`
    try {
      await navigator.clipboard.writeText(summary)
      setFeedback('copied')
    } catch {
      setFeedback(null)
    }
  }

  const cardClass = 'rounded-xl border border-border bg-card/85 shadow-[0_8px_28px_var(--card-shadow)] backdrop-blur transition hover:border-primary/30'

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 opacity-[0.22] [background-image:radial-gradient(circle_at_1px_1px,var(--grid-dot)_1px,transparent_0)] [background-size:24px_24px]" />
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6 sm:pb-8 lg:px-8">
        {!focusMode && (
          <nav className={`flex min-h-14 items-center justify-between gap-4 border-b border-border/80 ${motion}`}>
            <div className="flex min-w-0 items-center gap-2.5"><div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm"><TimerReset className="size-3.5" /></div><span className="truncate text-sm font-bold tracking-tight">SIF Tracker</span></div>
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3"><time className="block whitespace-nowrap font-mono text-[9px] font-semibold tabular-nums sm:text-[10px]">{philippineDate} · {philippineTime} PHT</time><ThemeToggle /></div>
          </nav>
        )}

        {!focusMode && (
          <section className={`py-5 sm:py-6 ${motion}`}>
            <div className="max-w-4xl"><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"><span className="size-1.5 animate-pulse rounded-full bg-[var(--sif-green)]" />Production time calculator</div><h1 className="text-4xl font-bold tracking-[-0.06em] sm:text-5xl lg:text-6xl">Work smart. Clock out smarter.</h1><p className="mt-1.5 whitespace-nowrap text-sm leading-5 text-muted-foreground">Enter your workload. Get your total time and clock-out instantly.</p></div>
          </section>
        )}

        <section id="calculator" className={motion}>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">01 / Calculator</p><h2 className="mt-1 text-lg font-semibold tracking-tight">{focusMode ? 'Workload' : 'Enter your workload'}</h2></div>
            <div className="flex flex-wrap gap-2">
              {!focusMode && <button type="button" onClick={() => setSettingsOpen((open) => !open)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-semibold shadow-sm transition hover:bg-accent"><Settings2 className="size-3" />Settings{unsavedRates && <span className="size-1.5 rounded-full bg-primary" />}</button>}
              <button type="button" onClick={() => setFocusMode((mode) => !mode)} className="rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-semibold shadow-sm transition hover:bg-accent">{focusMode ? 'Exit Focus' : 'Focus Mode'}</button>
            </div>
          </div>

          {!focusMode && settingsOpen && (
            <section id="settings" className={`${cardClass} mb-3 p-3.5`}>
              <div className="mb-3 flex items-center justify-between"><div><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Settings</p><h3 className="mt-1 text-sm font-semibold">Workload rates</h3></div><button type="button" onClick={() => setSettingsOpen(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent" aria-label="Close settings"><X className="size-3.5" /></button></div>
              <div className="grid gap-2 sm:grid-cols-2">
                {workloads.map((workload) => (
                  <div key={workload.id} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border bg-background/60 px-3 py-2.5">
                    <div className="min-w-0"><span className="block truncate text-[10px] font-semibold">{workload.label}</span><span className="text-[8px] text-muted-foreground">Minutes per {workload.unit.slice(0, -1)}</span></div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button type="button" onClick={() => adjustRate(workload.id, -1)} className="flex size-8 items-center justify-center rounded-md border border-border bg-card hover:bg-accent" aria-label={`Decrease ${workload.label}`}><Minus className="size-3" /></button>
                      {editingRate === workload.id ? <input autoFocus value={rateDraft} onChange={(event) => setRateDraft(event.target.value)} onBlur={() => commitRateEdit(workload.id)} onKeyDown={(event) => { if (event.key === 'Enter') commitRateEdit(workload.id); if (event.key === 'Escape') setEditingRate(null) }} className="h-8 w-14 rounded-md border border-input bg-background px-1 text-center font-mono text-sm font-bold" aria-label={`Edit ${workload.label} rate`} /> : <button type="button" onClick={() => beginRateEdit(workload.id)} className="w-12 rounded-md py-1 text-center font-mono text-sm font-bold hover:bg-accent" aria-label={`Edit ${workload.label} rate`}>{workload.minutesPerUnit}m</button>}
                      <button type="button" onClick={() => adjustRate(workload.id, 1)} className="flex size-8 items-center justify-center rounded-md border border-border bg-card hover:bg-accent" aria-label={`Increase ${workload.label}`}><Plus className="size-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-[8px] text-muted-foreground">{unsavedRates ? 'Unsaved changes' : 'Saved rates are active.'}</span><div className="flex gap-2"><button type="button" onClick={resetRates} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-[9px] font-bold hover:bg-accent"><RotateCcw className="size-3" />Reset</button><button type="button" onClick={saveRates} className="rounded-md bg-primary px-3 py-1.5 text-[9px] font-bold text-primary-foreground hover:opacity-90">Save</button></div></div>
            </section>
          )}

          <div className="grid min-w-0 gap-2.5 lg:grid-cols-2">
            {calculatedValues.map(({ workload, value }) => {
              const hasInput = values[workload.id] !== ''
              const invalid = hasInput && value === null
              return (
                <article key={workload.id} className={`${cardClass} flex min-w-0 flex-col p-3.5`}>
                  <div className="flex min-w-0 items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-2.5"><span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ backgroundColor: workload.accent }} /><div className="min-w-0"><h3 className="truncate text-sm font-semibold tracking-tight">{workload.label}</h3><p className="mt-0.5 text-[10px] text-muted-foreground">{workload.minutesPerUnit} minutes per {workload.unit.slice(0, -1)}</p></div></div><output className="shrink-0 font-mono text-[15px] font-bold tabular-nums" style={{ color: workload.accent }}>{formatDuration((value ?? 0) * workload.minutesPerUnit * 60)}</output></div>
                  <div className="mt-3"><span className="mb-1 block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Number of {workload.unit}</span><div className="flex items-center gap-1.5"><button type="button" onClick={() => adjustQuantity(workload.id, -1)} className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-input bg-background/70 hover:bg-accent" aria-label={`Decrease ${workload.label} quantity`}><Minus className="size-3.5" /></button><div className="relative min-w-0 flex-1"><input type="text" inputMode="text" autoComplete="off" value={values[workload.id]} onChange={(event) => updateValue(workload.id, event.target.value)} className={`h-11 w-full min-w-0 rounded-lg border bg-background/70 px-3 pr-16 font-mono text-[15px] font-medium tabular-nums outline-none transition ${invalid ? 'border-destructive focus:ring-4 focus:ring-destructive/10' : 'border-input focus:border-primary focus:ring-4 focus:ring-primary/10'}`} aria-invalid={invalid} aria-label={`Number of ${workload.unit} for ${workload.label}`} />{value !== null && hasInput && <output className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-[15px] font-semibold tabular-nums text-muted-foreground opacity-60">{value}</output>}</div><button type="button" onClick={() => adjustQuantity(workload.id, 1)} className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-input bg-background/70 hover:bg-accent" aria-label={`Increase ${workload.label} quantity`}><Plus className="size-3.5" /></button></div>{invalid ? <p className="mt-1.5 text-[9px] font-medium text-destructive">Invalid expression</p> : hasInput ? <p className="mt-1.5 rounded-md bg-background/40 px-2.5 py-1.5 font-mono text-[9px] font-semibold text-muted-foreground">{values[workload.id]} = {value}</p> : !focusMode && <p className="mt-1.5 text-[8px] text-muted-foreground/70">Use numbers or expressions like 5+5, 10*3, or (5+5)*2.</p>}</div>
                  {!focusMode && <div className="mt-auto grid grid-cols-2 gap-x-2 gap-y-1 border-t border-border pt-2.5 sm:grid-cols-4">{getExampleAmounts(workload).map((amount) => <span key={amount} className="font-mono text-[8px] font-semibold leading-3.5 tracking-tight text-muted-foreground">{getUnitLabel(workload.unit, amount)} = {formatCompactDuration(amount * workload.minutesPerUnit)}</span>)}</div>}
                </article>
              )
            })}

            <section id="workflow" className={`${cardClass} mt-0 border-primary/20 bg-primary p-4 text-primary-foreground`}>
              <div className="flex h-full flex-col justify-between gap-3 sm:flex-row sm:items-center"><div className="min-w-0"><p className="text-[8px] font-bold uppercase tracking-[0.18em] opacity-70">02 / Workflow</p><h3 className="mt-1 text-base font-semibold tracking-tight">One total, all workloads.</h3><p className="mt-1 text-[10px] leading-4 opacity-75">{totalUnits} total units across {workloads.length} workload types.</p></div><div className="min-w-0 text-left sm:text-right"><span className="block text-[8px] font-bold uppercase tracking-[0.16em] opacity-60">Total work time</span><strong className="mt-0.5 block whitespace-nowrap font-mono text-2xl font-bold tracking-[-0.04em] tabular-nums sm:text-3xl">{formatDuration(totalSeconds)}</strong></div></div>
            </section>
          </div>
        </section>

        {!focusMode && (
          <section id="shift" className={`${cardClass} mt-4 p-4`}>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">03 / Shift Summary</p><h2 className="mt-1 text-base font-semibold tracking-tight">Know when you’re done.</h2></div><span className="font-mono text-[9px] text-muted-foreground">PHT · fixed 01:00:00 break</span></div>
            <div className="grid min-w-0 gap-2.5 sm:grid-cols-4">
              <div className="min-w-0 rounded-lg border border-border bg-background/60 p-3"><span className="block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Clock in</span><input inputMode="numeric" value={clockInTime} onChange={(event) => handleClockInput(event.target.value)} className={`mt-1.5 h-10 w-full rounded-md border bg-background px-2 text-center font-mono text-sm font-bold tabular-nums outline-none ${validClockIn ? 'border-input focus:border-primary' : 'border-destructive focus:border-destructive'}`} aria-label="Clock in time" /><div className="mt-2 flex flex-wrap gap-1.5"><button type="button" onClick={() => applyClockPreset('now')} className="rounded-full border border-border bg-card px-2.5 py-1 text-[8px] font-semibold hover:bg-accent">Now</button><button type="button" onClick={() => applyClockPreset('08:00')} className="rounded-full border border-border bg-card px-2.5 py-1 text-[8px] font-semibold hover:bg-accent">08:00</button><button type="button" onClick={() => applyClockPreset('09:00')} className="rounded-full border border-border bg-card px-2.5 py-1 text-[8px] font-semibold hover:bg-accent">09:00</button><button type="button" onClick={() => applyClockPreset('10:00')} className="rounded-full border border-border bg-card px-2.5 py-1 text-[8px] font-semibold hover:bg-accent">10:00</button></div></div>
              <div className="min-w-0 rounded-lg border border-border bg-background/60 p-3"><span className="block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Worked</span><strong className="mt-1 block font-mono text-lg font-bold tabular-nums">{formatDuration(totalSeconds)}</strong><span className="mt-1 block text-[8px] text-muted-foreground">Workload time only.</span></div>
              <div className="min-w-0 rounded-lg border border-border bg-background/60 p-3"><span className="block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Break</span><strong className="mt-1 block font-mono text-lg font-bold tabular-nums">01:00:00</strong><span className="mt-1 block text-[8px] text-muted-foreground">Fixed break.</span></div>
              <div className="min-w-0 rounded-xl border border-primary/40 bg-primary/10 p-3"><div className="flex items-start justify-between gap-2"><div><span className="block text-[8px] font-bold uppercase tracking-[0.15em] text-primary">Clock Out</span><strong className="mt-1 block whitespace-nowrap font-mono text-2xl font-bold tracking-[-0.04em] tabular-nums text-primary sm:text-3xl">{formatMilitaryTime(estimatedClockOutSeconds)}</strong></div><button type="button" onClick={copySummary} className="rounded-md p-1.5 text-primary transition hover:bg-primary/10" aria-label="Copy shift summary" title="Copy shift summary"><Copy className="size-3.5" /></button></div><span className="mt-1 block text-[8px] text-muted-foreground">Workload + break</span></div>
            </div>
          </section>
        )}

        {!focusMode && <section id="tools" className={`${cardClass} mt-4 bg-card/50 p-3.5 sm:flex sm:items-center sm:justify-between sm:gap-4`}><div className="min-w-0"><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">04 / Tools</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">Reset today’s workload without changing your saved rates.</p></div><button type="button" onClick={() => setConfirmReset(true)} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-2 text-[10px] font-semibold hover:bg-accent sm:mt-0 sm:w-auto"><RotateCcw className="size-3" />Reset workload</button></section>}

        {!focusMode && <footer className="flex flex-col gap-1 py-4 text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>SIF Tracker</span><span>Created by Nicole</span></footer>}
      </div>

      {feedback && <div className="fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-[10px] font-semibold shadow-lg" role="status"><Check className="size-3 text-primary" />{feedback === 'saved' ? 'Rates saved' : feedback === 'reset' ? 'Workload reset' : 'Summary copied'}</div>}

      {confirmReset && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="reset-title" onMouseDown={(event) => { if (event.currentTarget === event.target) setConfirmReset(false) }}><div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Confirm reset</p><h3 id="reset-title" className="mt-1 text-sm font-semibold">Reset today’s workload?</h3><p className="mt-1.5 text-[10px] leading-4 text-muted-foreground">This clears all workload inputs and resets Clock In to the current PHT time. Your saved rates stay unchanged.</p></div><button type="button" onClick={() => setConfirmReset(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent" aria-label="Close reset confirmation"><X className="size-3.5" /></button></div><div className="mt-4 flex gap-2"><button type="button" onClick={() => setConfirmReset(false)} className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-[10px] font-bold hover:bg-accent">Cancel</button><button type="button" onClick={performReset} className="flex-1 rounded-md bg-primary px-3 py-2 text-[10px] font-bold text-primary-foreground hover:opacity-90">Reset</button></div></div></div>}
    </main>
  )
}
