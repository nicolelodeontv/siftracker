'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, RotateCcw, Settings2, TimerReset, X } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

type Workload = { id: string; label: string; unit: string; minutesPerUnit: number; accent: string; examples: string[] }
type HistoryItem = { id: number; date: string; workload: string; total: string; worked: string }

type RateMap = Record<string, number>

const defaultWorkloads: Workload[] = [
  { id: 'teamEdit', label: 'Team edit', unit: 'teams', minutesPerUnit: 15, accent: 'var(--chart-1)', examples: ['1 team = 15m', '4 teams = 1h', '16 teams = 4h', '32 teams = 8h'] },
  { id: 'indiClip', label: 'Indi clip', unit: 'indis', minutesPerUnit: 5, accent: 'var(--chart-2)', examples: ['1 indi = 5m', '12 indi = 1h', '48 indi = 4h', '96 indi = 8h'] },
  { id: 'indiEdit', label: 'Indi edit', unit: 'indis', minutesPerUnit: 5, accent: 'var(--chart-3)', examples: ['1 indi = 5m', '12 indi = 1h', '48 indi = 4h', '96 indi = 8h'] },
  { id: 'indiBuild', label: 'Indi build', unit: 'orders', minutesPerUnit: 4, accent: 'var(--chart-4)', examples: ['1 order = 4m', '15 orders = 1h', '60 orders = 4h', '120 orders = 8h'] },
  { id: 'lateOrders', label: 'Late orders', unit: 'orders', minutesPerUnit: 15, accent: 'var(--chart-5)', examples: ['1 order = 15m', '4 orders = 1h', '16 orders = 4h', '32 orders = 8h'] },
]

const EMPTY_VALUES = Object.fromEntries(defaultWorkloads.map(({ id }) => [id, '']))
const TIME_ZONE = 'Asia/Manila'
const STORAGE_KEY = 'sif-tracker-state-v6'
const DEFAULT_BREAK = 60 * 60
const STEP_MINUTES = 1

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remaining = seconds % 60
  return [hours, minutes, remaining].map((v) => String(v).padStart(2, '0')).join(':')
}

function formatPhilippineDate(date: Date) {
  return new Intl.DateTimeFormat('en-PH', { timeZone: TIME_ZONE, month: 'short', day: '2-digit', year: 'numeric' }).format(date)
}

function formatPhilippineTime(date: Date) {
  return new Intl.DateTimeFormat('en-PH', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, hourCycle: 'h23' }).format(date)
}

function getPhilippineParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(date)
  return Object.fromEntries(parts.map(({ type, value }) => [type, value])) as Record<string, string>
}

function timeToSeconds(value: string) {
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value)
  if (!match) return null
  const hours = Number(match[1]); const minutes = Number(match[2]); const seconds = Number(match[3] ?? '0')
  return hours <= 23 && minutes <= 59 && seconds <= 59 ? hours * 3600 + minutes * 60 + seconds : null
}

function secondsToTime(totalSeconds: number) {
  const seconds = ((Math.round(totalSeconds) % 86400) + 86400) % 86400
  const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); const remaining = seconds % 60
  return [hours, minutes, remaining].map((v) => String(v).padStart(2, '0')).join(':')
}

function durationBetween(startTime: string, endTime: string) {
  const start = timeToSeconds(startTime); const end = timeToSeconds(endTime)
  if (start === null || end === null) return null
  const duration = end - start
  return duration < 0 ? duration + 86400 : duration
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
    const parseExpression = (): number => { let result = parseTerm(); while (tokens[index.value] === '+' || tokens[index.value] === '-') { const op = tokens[index.value++]; const next = parseTerm(); result = op === '+' ? result + next : result - next }; return result }
    const parseTerm = (): number => { let result = parseFactor(); while (tokens[index.value] === '*' || tokens[index.value] === '/') { const op = tokens[index.value++]; const next = parseFactor(); if (op === '/' && next === 0) throw new Error(); result = op === '*' ? result * next : result / next }; return result }
    const parseFactor = (): number => { const token = tokens[index.value++]; if (token === '(') { const result = parseExpression(); if (tokens[index.value++] !== ')') throw new Error(); return result }; if (token === '-') return -parseFactor(); if (!token || Number.isNaN(Number(token))) throw new Error(); return Number(token) }
    const result = parseExpression()
    if (index.value !== tokens.length || !Number.isFinite(result) || Math.abs(result) > 1_000_000) return null
    const rounded = Number.isInteger(result) ? result : Number(result.toFixed(2))
    return declaredTotal !== undefined && Number(declaredTotal) !== rounded ? null : rounded
  } catch { return null }
}

export default function Page() {
  const [values, setValues] = useState<Record<string, string>>(() => ({ ...EMPTY_VALUES }))
  const [philippineTime, setPhilippineTime] = useState('00:00:00')
  const [philippineDate, setPhilippineDate] = useState('Jan 01, 1970')
  const [mounted, setMounted] = useState(false)
  const [clockInTime, setClockInTime] = useState('09:00:00')
  const [clockOutTime, setClockOutTime] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [rates, setRates] = useState<RateMap>(() => Object.fromEntries(defaultWorkloads.map(({ id, minutesPerUnit }) => [id, minutesPerUnit])))
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    const update = () => { const current = new Date(); setPhilippineTime(formatPhilippineTime(current)); setPhilippineDate(formatPhilippineDate(current)) }
    const current = new Date(); const parts = getPhilippineParts(current); setClockInTime(`${parts.hour}:${parts.minute}:${parts.second}`); update()
    const interval = window.setInterval(update, 1000)
    const frame = window.requestAnimationFrame(() => setMounted(true))
    return () => { window.clearInterval(interval); window.cancelAnimationFrame(frame) }
  }, [])

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')
      if (saved?.values) setValues({ ...EMPTY_VALUES, ...saved.values })
      if (saved?.clockOutTime) setClockOutTime(saved.clockOutTime)
      if (saved?.history?.length) setHistory(saved.history.slice(0, 8))
      if (saved?.rates) setRates((current) => ({ ...current, ...saved.rates }))
    } catch {}
  }, [])

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ values, clockInTime, clockOutTime, history, rates })) } catch {}
  }, [values, clockInTime, clockOutTime, history, rates])

  const workloads = useMemo(() => defaultWorkloads.map((workload) => ({ ...workload, minutesPerUnit: rates[workload.id] ?? workload.minutesPerUnit })), [rates])
  const calculatedValues = useMemo(() => workloads.map((workload) => ({ workload, value: calculateValue(values[workload.id]) })), [workloads, values])
  const totalSeconds = useMemo(() => calculatedValues.reduce((total, { workload, value }) => total + (value ?? 0) * workload.minutesPerUnit * 60, 0), [calculatedValues])
  const totalUnits = useMemo(() => calculatedValues.reduce((total, { value }) => total + Math.max(0, value ?? 0), 0), [calculatedValues])
  const shiftDuration = durationBetween(clockInTime, clockOutTime)
  const workedSeconds = shiftDuration === null ? 0 : Math.max(0, shiftDuration - DEFAULT_BREAK)
  const estimatedClockOut = timeToSeconds(clockInTime) === null ? null : secondsToTime((timeToSeconds(clockInTime) ?? 0) + totalSeconds + DEFAULT_BREAK)
  const motion = mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'

  function updateValue(id: string, value: string) { if (/^[\d+*/().=\s-]*$/.test(value)) setValues((current) => ({ ...current, [id]: value })) }
  function addQuickValue(id: string, amount: number) { setValues((current) => ({ ...current, [id]: String((calculateValue(current[id]) ?? 0) + amount) })) }
  function adjustRate(id: string, delta: number) { setRates((current) => ({ ...current, [id]: Math.max(STEP_MINUTES, Math.min(240, (current[id] ?? 1) + delta)) })) }

  function reset() { setValues({ ...EMPTY_VALUES }); setClockOutTime('') }
  function clearHistory() { setHistory([]) }

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 opacity-[0.25] [background-image:radial-gradient(circle_at_1px_1px,var(--grid-dot)_1px,transparent_0)] [background-size:24px_24px]" />
      <div className="relative mx-auto w-full max-w-6xl px-5 pb-6 sm:px-7 lg:px-8">
        <nav className={`flex h-14 items-center justify-between border-b border-border/80 transition-all duration-500 ${motion}`}>
          <div className="flex items-center gap-2.5"><div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm"><TimerReset className="size-3.5" /></div><div className="leading-none"><span className="block text-sm font-bold tracking-tight">SIF Tracker</span><span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Operations</span></div></div>
          <div className="flex items-center gap-3"><div className="text-right font-mono leading-none" aria-label="Philippine Standard Time"><span className="block text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground">PHT</span><time className="mt-1 block text-[10px] font-semibold tabular-nums sm:text-[11px]">{philippineDate}</time><time className="mt-0.5 block text-[11px] font-bold tabular-nums sm:text-xs">{philippineTime}</time></div><ThemeToggle /></div>
        </nav>

        <section className={`py-7 sm:py-9 transition-all duration-700 ${motion}`}><div className="max-w-3xl"><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"><span className="size-1.5 animate-pulse rounded-full bg-[var(--sif-green)]" />Production time calculator</div><h1 className="text-4xl font-bold tracking-[-0.06em] sm:text-5xl lg:text-6xl">Time, tracked simply.</h1><p className="mt-3 max-w-3xl text-sm leading-5 text-muted-foreground">Plan workload with editable rates, then use the same calculator to estimate your finish time.</p></div></section>

        <section id="calculator" className={`transition-all duration-700 ${motion}`}>
          <div className="mb-3 flex items-end justify-between gap-4"><div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">01 / Calculator</p><h2 className="mt-1 text-lg font-semibold tracking-tight">Enter your workload</h2></div><button type="button" onClick={() => setSettingsOpen((open) => !open)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-semibold hover:bg-accent" aria-expanded={settingsOpen}><Settings2 className="size-3" />Workload rates</button></div>

          {settingsOpen && <section className="mb-3 rounded-xl border border-border bg-card/85 p-3.5 shadow-[0_8px_28px_var(--card-shadow)] backdrop-blur"><div className="mb-3 flex items-center justify-between"><div><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Settings</p><h3 className="mt-1 text-sm font-semibold">Workload rates</h3></div><button type="button" onClick={() => setSettingsOpen(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close workload rate settings"><X className="size-3.5" /></button></div><div className="grid gap-2 sm:grid-cols-2">{workloads.map((workload) => <div key={workload.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 px-3 py-2.5"><div className="min-w-0"><span className="block text-[10px] font-semibold">{workload.label}</span><span className="text-[8px] text-muted-foreground">minutes per {workload.unit.slice(0, -1)}</span></div><div className="flex items-center gap-2"><button type="button" onClick={() => adjustRate(workload.id, -STEP_MINUTES)} className="flex size-8 items-center justify-center rounded-md border border-border bg-card font-mono text-sm font-bold hover:bg-accent" aria-label={`Decrease ${workload.label} rate`}>−</button><output className="w-12 text-center font-mono text-sm font-bold tabular-nums">{workload.minutesPerUnit}m</output><button type="button" onClick={() => adjustRate(workload.id, STEP_MINUTES)} className="flex size-8 items-center justify-center rounded-md border border-border bg-card font-mono text-sm font-bold hover:bg-accent" aria-label={`Increase ${workload.label} rate`}>+</button></div></div>)}</div><p className="mt-3 text-[8px] text-muted-foreground">Rates are saved automatically in this browser.</p></section>}

          <div className="grid gap-2.5 lg:grid-cols-2">
            {calculatedValues.map(({ workload, value }) => <article key={workload.id} className="group min-w-0 rounded-xl border border-border bg-card/85 p-3.5 shadow-[0_8px_28px_var(--card-shadow)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-2.5"><span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ backgroundColor: workload.accent }} /><div><h3 className="text-sm font-semibold tracking-tight">{workload.label}</h3><p className="mt-0.5 text-[10px] text-muted-foreground">{workload.minutesPerUnit} minutes per {workload.unit.slice(0, -1)}</p></div></div><output className="font-mono text-[15px] font-bold tabular-nums" style={{ color: workload.accent }}>{formatDuration((value ?? 0) * workload.minutesPerUnit * 60)}</output></div><label className="mt-3 block"><span className="mb-1 block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Number of {workload.unit}</span><div className="relative"><input type="text" inputMode="numeric" value={values[workload.id]} onChange={(event) => updateValue(workload.id, event.target.value)} placeholder="0" className="h-11 w-full rounded-lg border border-input bg-background/70 px-3 pr-14 font-mono text-[15px] font-medium tabular-nums outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />{value !== null && <output className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-[15px] font-semibold tabular-nums text-muted-foreground">{value}</output>}</div></label><div className="mt-2 flex gap-1.5"><span className="mr-auto self-center text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Quick add</span>{[1, 5, 10].map((amount) => <button key={amount} type="button" onClick={() => addQuickValue(workload.id, amount)} className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[9px] font-semibold hover:bg-accent">+{amount}</button>)}</div><div className="mt-2.5 grid grid-cols-2 gap-x-2 gap-y-1 border-t border-border pt-2.5 sm:grid-cols-4">{workload.examples.map((example, index) => <span key={`${workload.id}-${index}`} className="font-mono text-[8px] font-semibold leading-3.5 tracking-tight text-muted-foreground">{example.replace(/\d+\s*min/, `${workload.minutesPerUnit}m`)}</span>)}</div></article>)}

            <section id="workflow" className="rounded-xl border border-primary/15 bg-primary p-3.5 text-primary-foreground shadow-[0_8px_28px_var(--card-shadow)]"><div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center"><div><p className="text-[8px] font-bold uppercase tracking-[0.18em] opacity-70">02 / Workflow</p><h3 className="mt-1 text-base font-semibold tracking-tight">One total, all workloads.</h3><p className="mt-1 text-[10px] leading-4 opacity-75">{totalUnits || 0} total units across {workloads.length} workload types.</p></div><div className="text-left sm:text-right"><span className="block text-[8px] font-bold uppercase tracking-[0.16em] opacity-60">Combined total</span><strong className="mt-0.5 block whitespace-nowrap font-mono text-2xl font-bold tracking-[-0.04em] tabular-nums sm:text-3xl">{formatDuration(totalSeconds)}</strong></div></div></section>
          </div>
        </section>

        <section id="finish-time" className="mt-5 rounded-xl border border-border bg-card/70 p-4 shadow-[0_8px_28px_var(--card-shadow)] backdrop-blur"><div className="mb-3 flex items-end justify-between gap-4"><div><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">03 / Shift control</p><h2 className="mt-1 text-base font-semibold tracking-tight">Clock in & clock out</h2></div><span className="font-mono text-[9px] text-muted-foreground">PHT · 24-hour · seconds</span></div><div className="grid gap-3 sm:grid-cols-3"><label><span className="mb-1 block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Clock in</span><input type="time" step="1" value={clockInTime} onChange={(e) => setClockInTime(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm tabular-nums outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" /></label><label><span className="mb-1 block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Clock out</span><input type="time" step="1" value={clockOutTime} onChange={(e) => setClockOutTime(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm tabular-nums outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" /></label><div className="rounded-lg border border-border bg-background/60 p-3"><span className="block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Break</span><strong className="mt-1 block font-mono text-xl font-bold tabular-nums">01:00:00</strong><span className="mt-1 block text-[9px] text-muted-foreground">Fixed 1-hour break</span></div></div><div className="mt-3 grid gap-3 sm:grid-cols-3"><div className="rounded-lg border border-border bg-background/60 p-3"><span className="block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Total hours worked</span><strong className="mt-1 block font-mono text-xl font-bold tabular-nums">{shiftDuration !== null ? formatDuration(workedSeconds) : '—'}</strong></div><div className="rounded-lg border border-primary/20 bg-primary/5 p-3"><span className="block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Estimated Clock Out</span><strong className="mt-1 block font-mono text-xl font-bold tabular-nums">{estimatedClockOut ?? '—'}</strong><span className="mt-1 block text-[9px] text-muted-foreground">Based on current workload</span></div><div className="rounded-lg border border-border bg-background/60 p-3"><span className="block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Workload time</span><strong className="mt-1 block font-mono text-xl font-bold tabular-nums">{formatDuration(totalSeconds)}</strong></div></div></section>

        <section id="history" className="mt-5 rounded-xl border border-border bg-card/70 p-4 shadow-[0_8px_28px_var(--card-shadow)] backdrop-blur"><div className="mb-3 flex items-end justify-between gap-4"><div><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">04 / History</p><h2 className="mt-1 text-base font-semibold tracking-tight">Recent sessions</h2></div>{history.length > 0 && <button type="button" onClick={clearHistory} className="inline-flex items-center gap-1 text-[9px] font-semibold text-muted-foreground hover:text-foreground">Clear</button>}</div>{history.length === 0 ? <p className="py-3 text-[10px] text-muted-foreground">No saved sessions yet.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left"><thead className="border-b border-border text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground"><tr><th className="px-2 py-2">Date</th><th className="px-2 py-2">Workload</th><th className="px-2 py-2">Planned</th><th className="px-2 py-2">Worked</th></tr></thead><tbody>{history.map((item) => <tr key={item.id} className="border-b border-border/70 last:border-0"><td className="px-2 py-2 font-mono text-[9px] tabular-nums">{item.date}</td><td className="px-2 py-2 text-[9px] font-semibold">{item.workload}</td><td className="px-2 py-2 font-mono text-[9px] tabular-nums">{item.total}</td><td className="px-2 py-2 font-mono text-[9px] font-semibold tabular-nums">{item.worked}</td></tr>)}</tbody></table></div>}</section>

        <section id="about" className="mt-5 border-y border-border py-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">05 / About</p><p className="mt-1 max-w-xl text-[10px] leading-4 text-muted-foreground"><span className="block">Built as a simple internal production planning tool.</span><span className="block">Type numbers or expressions such as <span className="font-mono text-foreground">4*3</span> directly into any field.</span></p></div><button type="button" onClick={reset} className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-semibold hover:bg-accent"><RotateCcw className="size-3" />Reset all<ArrowUpRight className="size-3 opacity-50" /></button></div></section>
        <footer className="flex flex-col gap-1 py-4 text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>SIF Tracker</span><span>Created by Nicole</span></footer>
      </div>

      <div className="mobile-total-bar" aria-live="polite"><div><span className="mobile-total-label">TOTAL</span><strong>{formatDuration(totalSeconds)}</strong></div><div className="mobile-total-meta"><span>{formatDuration(workedSeconds)}</span><span>WORKED</span></div><div className="mobile-total-meta"><span>{estimatedClockOut ?? '—'}</span><span>OUT</span></div></div>
    </main>
  )
}
