'use client'

import { useEffect, useMemo, useState } from 'react'
import { Minus, Plus, RotateCcw, Settings2, TimerReset, X } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

type Workload = {
  id: string
  label: string
  unit: string
  minutesPerUnit: number
  accent: string
}

type RateMap = Record<string, number>

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

function formatExampleDuration(totalMinutes: number) {
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

export default function Page() {
  const [values, setValues] = useState<Record<string, string>>({ ...EMPTY_VALUES })
  const [rates, setRates] = useState<RateMap>({ ...DEFAULT_RATES })
  const [savedRates, setSavedRates] = useState<RateMap>({ ...DEFAULT_RATES })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [clockInTime, setClockInTime] = useState('09:00:00')
  const [philippineTime, setPhilippineTime] = useState('00:00:00')
  const [philippineDate, setPhilippineDate] = useState('Jan 01, 1970')
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

  const workloads = useMemo(
    () => DEFAULT_WORKLOADS.map((workload) => ({ ...workload, minutesPerUnit: rates[workload.id] ?? workload.minutesPerUnit })),
    [rates],
  )

  const calculatedValues = useMemo(
    () => workloads.map((workload) => ({ workload, value: calculateValue(values[workload.id] ?? '') })),
    [workloads, values],
  )

  const totalSeconds = useMemo(
    () => calculatedValues.reduce((total, { workload, value }) => total + (value ?? 0) * workload.minutesPerUnit * 60, 0),
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

  const motion = mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'

  function updateValue(id: string, value: string) {
    if (/^[\d+*/().=\s-]*$/.test(value)) {
      setValues((current) => ({ ...current, [id]: value }))
    }
  }

  function adjustRate(id: string, delta: number) {
    setRates((current) => ({
      ...current,
      [id]: Math.max(1, Math.min(240, (current[id] ?? DEFAULT_RATES[id]) + delta)),
    }))
  }

  function saveRates() {
    setSavedRates({ ...rates })
    setSettingsOpen(false)
  }

  function resetRates() {
    const defaults = { ...DEFAULT_RATES }
    setRates(defaults)
    setSavedRates(defaults)
  }

  function resetAll() {
    setValues({ ...EMPTY_VALUES })
    setClockInTime(getCurrentClockIn())
  }

  function updateClockPart(part: 'hour' | 'minute' | 'second', rawValue: string) {
    const nextValue = Number(rawValue)
    const currentSeconds = timeToSeconds(clockInTime) ?? 0
    let hours = Math.floor(currentSeconds / 3600)
    let minutes = Math.floor((currentSeconds % 3600) / 60)
    let seconds = currentSeconds % 60

    if (part === 'hour') hours = Math.min(23, Math.max(0, nextValue))
    if (part === 'minute') minutes = Math.min(59, Math.max(0, nextValue))
    if (part === 'second') seconds = Math.min(59, Math.max(0, nextValue))

    setClockInTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
  }

  const clockParts = {
    hour: Math.floor((timeToSeconds(clockInTime) ?? 0) / 3600),
    minute: Math.floor(((timeToSeconds(clockInTime) ?? 0) % 3600) / 60),
    second: (timeToSeconds(clockInTime) ?? 0) % 60,
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 opacity-[0.22] [background-image:radial-gradient(circle_at_1px_1px,var(--grid-dot)_1px,transparent_0)] [background-size:24px_24px]" />
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6 sm:pb-8 lg:px-8">
        <nav className={`flex min-h-14 items-center justify-between gap-4 border-b border-border/80 ${motion}`}>
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm"><TimerReset className="size-3.5" /></div>
            <div className="min-w-0 leading-none"><span className="block truncate text-sm font-bold tracking-tight">SIF Tracker</span><span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Operations</span></div>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0 text-right font-mono leading-none" aria-label="Philippine Standard Time"><span className="block text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground">PHT</span><time className="mt-1 block whitespace-nowrap text-[10px] font-semibold tabular-nums sm:text-[11px]">{philippineDate} · {philippineTime}</time></div>
            <ThemeToggle />
          </div>
        </nav>

        <section className={`py-5 sm:py-6 ${motion}`}>
          <div className="max-w-4xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"><span className="size-1.5 animate-pulse rounded-full bg-[var(--sif-green)]" />Production time calculator</div>
            <h1 className="text-4xl font-bold tracking-[-0.06em] sm:text-5xl lg:text-6xl">Work smart. Clock out smarter.</h1>
            <p className="mt-1.5 text-sm leading-5 text-muted-foreground sm:whitespace-nowrap">Enter your workload. Get your total time and clock-out instantly.</p>
          </div>
        </section>

        <section id="calculator" className={`${motion}`}>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">01 / Calculator</p><h2 className="mt-1 text-lg font-semibold tracking-tight">Enter your workload</h2></div>
            <button type="button" onClick={() => setSettingsOpen((open) => !open)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-semibold shadow-sm hover:bg-accent" aria-expanded={settingsOpen}><Settings2 className="size-3" />Settings</button>
          </div>

          {settingsOpen && (
            <section id="settings" className="mb-3 rounded-xl border border-border bg-card/90 p-3.5 shadow-[0_8px_28px_var(--card-shadow)] backdrop-blur">
              <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Settings</p><h3 className="mt-1 text-sm font-semibold">Workload rates</h3></div><button type="button" onClick={() => setSettingsOpen(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close settings"><X className="size-3.5" /></button></div>
              <div className="grid gap-2 sm:grid-cols-2">
                {workloads.map((workload) => (
                  <div key={workload.id} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border bg-background/60 px-3 py-2.5">
                    <div className="min-w-0"><span className="block truncate text-[10px] font-semibold">{workload.label}</span><span className="text-[8px] text-muted-foreground">Minutes per {workload.unit.slice(0, -1)}</span></div>
                    <div className="flex shrink-0 items-center gap-2"><button type="button" onClick={() => adjustRate(workload.id, -1)} className="flex size-8 items-center justify-center rounded-md border border-border bg-card hover:bg-accent" aria-label={`Decrease ${workload.label}`}><Minus className="size-3" /></button><output className="w-12 text-center font-mono text-sm font-bold tabular-nums">{workload.minutesPerUnit}m</output><button type="button" onClick={() => adjustRate(workload.id, 1)} className="flex size-8 items-center justify-center rounded-md border border-border bg-card hover:bg-accent" aria-label={`Increase ${workload.label}`}><Plus className="size-3" /></button></div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-[8px] text-muted-foreground">Save applies the rates to the calculator.</span><div className="flex gap-2"><button type="button" onClick={resetRates} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-[9px] font-bold hover:bg-accent"><RotateCcw className="size-3" />Reset</button><button type="button" onClick={saveRates} className="rounded-md bg-primary px-3 py-1.5 text-[9px] font-bold text-primary-foreground hover:opacity-90">Save</button></div></div>
            </section>
          )}

          <div className="grid min-w-0 items-stretch gap-2.5 lg:grid-cols-2">
            {calculatedValues.map(({ workload, value }) => (
              <article key={workload.id} className="flex min-w-0 h-full flex-col rounded-xl border border-border bg-card/85 p-3.5 shadow-[0_8px_28px_var(--card-shadow)] backdrop-blur transition-colors hover:border-primary/30">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2.5"><span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ backgroundColor: workload.accent }} /><div className="min-w-0"><h3 className="truncate text-sm font-semibold tracking-tight">{workload.label}</h3><p className="mt-0.5 text-[10px] text-muted-foreground">{workload.minutesPerUnit} minutes per {workload.unit.slice(0, -1)}</p></div></div>
                  <output className="shrink-0 font-mono text-[15px] font-bold tabular-nums" style={{ color: workload.accent }}>{formatDuration((value ?? 0) * workload.minutesPerUnit * 60)}</output>
                </div>
                <label className="mt-3 block"><span className="mb-1 block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Number of {workload.unit}</span><div className="relative"><input type="text" inputMode="text" value={values[workload.id]} onChange={(event) => updateValue(workload.id, event.target.value)} className="h-11 w-full min-w-0 rounded-lg border border-input bg-background/70 px-3 pr-16 font-mono text-[15px] font-medium tabular-nums outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" />{value !== null && values[workload.id] !== '' && <output className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-[15px] font-semibold tabular-nums text-muted-foreground opacity-60">{value}</output>}</div></label>
                <div className="mt-auto grid grid-cols-2 gap-x-2 gap-y-1 border-t border-border pt-2.5 sm:grid-cols-4">{getExampleAmounts(workload).map((amount) => <span key={amount} className="font-mono text-[8px] font-semibold leading-3.5 tracking-tight text-muted-foreground">{getUnitLabel(workload.unit, amount)} = {formatExampleDuration(amount * workload.minutesPerUnit)}</span>)}</div>
              </article>
            ))}

            <section id="workflow" className="min-w-0 h-full self-stretch rounded-xl border border-primary/15 bg-primary p-3.5 text-primary-foreground shadow-[0_8px_28px_var(--card-shadow)]">
              <div className="flex h-full flex-col justify-between gap-3 sm:flex-row sm:items-center"><div className="min-w-0"><p className="text-[8px] font-bold uppercase tracking-[0.18em] opacity-70">02 / Workflow</p><h3 className="mt-1 text-base font-semibold tracking-tight">One total, all workloads.</h3><p className="mt-1 text-[10px] leading-4 opacity-75">{totalUnits} total units across {workloads.length} workload types.</p></div><div className="min-w-0 text-left sm:text-right"><span className="block text-[8px] font-bold uppercase tracking-[0.16em] opacity-60">Total work time</span><strong className="mt-0.5 block whitespace-nowrap font-mono text-2xl font-bold tracking-[-0.04em] tabular-nums sm:text-3xl">{formatDuration(totalSeconds)}</strong></div></div>
            </section>
          </div>
        </section>

        <section id="shift" className="mt-5 rounded-xl border border-border bg-card/80 p-4 shadow-[0_8px_28px_var(--card-shadow)] backdrop-blur">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">03 / Shift</p><h2 className="mt-1 text-base font-semibold tracking-tight">Automatic clock-out</h2></div><span className="font-mono text-[9px] text-muted-foreground">PHT · fixed 1-hour break</span></div>
          <div className="grid min-w-0 gap-3 sm:grid-cols-3">
            <div className="min-w-0 rounded-lg border border-border bg-background/60 p-3"><span className="block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Clock in</span><div className="shift-time-picker" role="group" aria-label="Clock in time"><select aria-label="Clock in hour" value={clockParts.hour} onChange={(event) => updateClockPart('hour', event.target.value)}><option value="0">00</option>{Array.from({ length: 23 }, (_, index) => <option key={index + 1} value={index + 1}>{String(index + 1).padStart(2, '0')}</option>)}</select><select aria-label="Clock in minute" value={clockParts.minute} onChange={(event) => updateClockPart('minute', event.target.value)}>{Array.from({ length: 60 }, (_, index) => <option key={index} value={index}>{String(index).padStart(2, '0')}</option>)}</select><select aria-label="Clock in second" value={clockParts.second} onChange={(event) => updateClockPart('second', event.target.value)}>{Array.from({ length: 60 }, (_, index) => <option key={index} value={index}>{String(index).padStart(2, '0')}</option>)}</select></div><span className="mt-1 block text-[8px] text-muted-foreground">24-hour format · automatically set to current PHT when opened.</span></div>
            <div className="min-w-0 rounded-lg border border-border bg-background/60 p-3"><span className="block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Total hours worked</span><strong className="mt-1 block font-mono text-lg font-bold tabular-nums">{totalUnits === 0 ? '00:00:00' : formatDuration(totalSeconds)}</strong><span className="mt-1 block text-[8px] text-muted-foreground">Workload time, excluding break.</span></div>
            <div className="min-w-0 rounded-lg border border-primary/20 bg-primary/5 p-3"><span className="block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Clock Out</span><strong className="mt-1 block whitespace-nowrap font-mono text-lg font-bold tabular-nums">{formatMilitaryTime(estimatedClockOutSeconds)}</strong><span className="mt-1 block text-[8px] text-muted-foreground">Workload + 01:00:00 break.</span></div>
          </div>
        </section>

        <section id="tools" className="mt-5 rounded-xl border border-border/80 bg-card/50 p-3.5 shadow-sm backdrop-blur sm:flex sm:items-center sm:justify-between sm:gap-4"><div className="min-w-0"><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">04 / Tools</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">Reset today’s workload without touching your saved settings.</p></div><button type="button" onClick={resetAll} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1.5 text-[10px] font-semibold hover:bg-accent sm:mt-0 sm:w-auto"><RotateCcw className="size-3" />Reset workload</button></section>

        <footer className="flex flex-col gap-1 py-4 text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>SIF Tracker</span><span>Created by Nicole</span></footer>
      </div>

      <div className="mobile-total-bar" aria-live="polite"><div><span className="mobile-total-label">WORKED</span><strong>{formatDuration(totalSeconds)}</strong></div><div><span className="mobile-total-label">OUT</span><strong>{formatMilitaryTime(estimatedClockOutSeconds)}</strong></div><div><span className="mobile-total-label">BREAK</span><strong>01:00:00</strong></div></div>
    </main>
  )
}
