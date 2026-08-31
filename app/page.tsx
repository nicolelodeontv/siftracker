'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, CirclePause, CirclePlay, RotateCcw, Square, TimerReset, Trash2 } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

type Workload = { id: string; label: string; unit: string; minutesPerUnit: number; accent: string; examples: string[] }
type HistoryItem = { id: number; date: string; workload: string; total: string; worked: string }

const workloads: Workload[] = [
  { id: 'teamEdit', label: 'Team edit', unit: 'teams', minutesPerUnit: 15, accent: 'var(--chart-1)', examples: ['1 team = 15m', '4 teams = 1h', '16 teams = 4h', '32 teams = 8h'] },
  { id: 'indiClip', label: 'Indi clip', unit: 'indis', minutesPerUnit: 5, accent: 'var(--chart-2)', examples: ['1 indi = 5m', '12 indi = 1h', '48 indi = 4h', '96 indi = 8h'] },
  { id: 'indiEdit', label: 'Indi edit', unit: 'indis', minutesPerUnit: 5, accent: 'var(--chart-3)', examples: ['1 indi = 5m', '12 indi = 1h', '48 indi = 4h', '96 indi = 8h'] },
  { id: 'indiBuild', label: 'Indi build', unit: 'orders', minutesPerUnit: 4, accent: 'var(--chart-4)', examples: ['1 order = 4m', '15 orders = 1h', '60 orders = 4h', '120 orders = 8h'] },
  { id: 'lateOrders', label: 'Late orders', unit: 'orders', minutesPerUnit: 15, accent: 'var(--chart-5)', examples: ['1 order = 15m', '4 orders = 1h', '16 orders = 4h', '32 orders = 8h'] },
]

const EMPTY_VALUES = Object.fromEntries(workloads.map(({ id }) => [id, '']))
const TIME_ZONE = 'Asia/Manila'
const STORAGE_KEY = 'sif-tracker-state-v4'
const DEFAULT_BREAK = 60 * 60
const DEFAULT_TARGET = 8 * 60 * 60

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
  const [breakSeconds, setBreakSeconds] = useState(DEFAULT_BREAK)
  const [targetSeconds, setTargetSeconds] = useState(DEFAULT_TARGET)
  const [running, setRunning] = useState(false)
  const [pausedSeconds, setPausedSeconds] = useState(0)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')
      if (saved?.values) setValues({ ...EMPTY_VALUES, ...saved.values })
      if (typeof saved?.clockInTime === 'string') setClockInTime(saved.clockInTime)
      if (typeof saved?.clockOutTime === 'string') setClockOutTime(saved.clockOutTime)
      if (typeof saved?.breakSeconds === 'number') setBreakSeconds(saved.breakSeconds)
      if (typeof saved?.targetSeconds === 'number') setTargetSeconds(saved.targetSeconds)
      if (typeof saved?.history?.length === 'number') setHistory(saved.history.slice(0, 8))
      if (typeof saved?.pausedSeconds === 'number') setPausedSeconds(saved.pausedSeconds)
    } catch {}
  }, [])

  useEffect(() => {
    const update = () => { const current = new Date(); setNowMs(Date.now()); setPhilippineTime(formatPhilippineTime(current)); setPhilippineDate(formatPhilippineDate(current)) }
    update()
    const interval = window.setInterval(update, 1000)
    const frame = window.requestAnimationFrame(() => setMounted(true))
    return () => { window.clearInterval(interval); window.cancelAnimationFrame(frame) }
  }, [])

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ values, clockInTime, clockOutTime, breakSeconds, targetSeconds, pausedSeconds, history })) } catch {}
  }, [values, clockInTime, clockOutTime, breakSeconds, targetSeconds, pausedSeconds, history])

  const calculatedValues = useMemo(() => workloads.map((workload) => ({ workload, value: calculateValue(values[workload.id]) })), [values])
  const totalSeconds = useMemo(() => calculatedValues.reduce((total, { workload, value }) => total + (value ?? 0) * workload.minutesPerUnit * 60, 0), [calculatedValues])
  const totalUnits = useMemo(() => calculatedValues.reduce((total, { value }) => total + Math.max(0, value ?? 0), 0), [calculatedValues])

  const liveSessionSeconds = pausedSeconds + (running && startedAt !== null ? Math.max(0, (nowMs - startedAt) / 1000) : 0)
  const manualShiftSeconds = durationBetween(clockInTime, clockOutTime)
  const workedSeconds = manualShiftSeconds !== null ? Math.max(0, manualShiftSeconds - breakSeconds) : Math.max(0, liveSessionSeconds - breakSeconds)
  const progress = targetSeconds > 0 ? Math.min(100, (workedSeconds / targetSeconds) * 100) : 0
  const remainingSeconds = Math.max(0, targetSeconds - workedSeconds)
  const baseClockIn = timeToSeconds(clockInTime)
  const estimatedClockOut = baseClockIn === null ? null : secondsToTime(baseClockIn + totalSeconds + breakSeconds)
  const motion = mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'

  function updateValue(id: string, value: string) { if (/^[\d+*/().=\s-]*$/.test(value)) setValues((current) => ({ ...current, [id]: value })) }
  function addQuickValue(id: string, amount: number) { setValues((current) => ({ ...current, [id]: String((calculateValue(current[id]) ?? 0) + amount) })) }

  function clockIn() {
    const now = new Date(); const parts = getPhilippineParts(now)
    setClockInTime(`${parts.hour}:${parts.minute}:${parts.second}`); setClockOutTime(''); setPausedSeconds(0); setStartedAt(now.getTime()); setRunning(true)
  }

  function pauseTimer() { if (!running || startedAt === null) return; setPausedSeconds((current) => current + (Date.now() - startedAt) / 1000); setStartedAt(null); setRunning(false) }
  function resumeTimer() { setStartedAt(Date.now()); setRunning(true); setClockOutTime('') }

  function clockOut() {
    const now = new Date(); const parts = getPhilippineParts(now)
    const finalSessionSeconds = pausedSeconds + (running && startedAt !== null ? (now.getTime() - startedAt) / 1000 : 0)
    setPausedSeconds(finalSessionSeconds); setStartedAt(null); setRunning(false); setClockOutTime(`${parts.hour}:${parts.minute}:${parts.second}`)
    setHistory((current) => [{ id: Date.now(), date: formatPhilippineDate(now), workload: `${totalUnits || 0} units`, total: formatDuration(totalSeconds), worked: formatDuration(Math.max(0, finalSessionSeconds - breakSeconds)) }, ...current].slice(0, 8))
  }

  function reset() { setValues({ ...EMPTY_VALUES }); setClockOutTime(''); setPausedSeconds(0); setStartedAt(null); setRunning(false) }
  function clearHistory() { setHistory([]) }

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 opacity-[0.25] [background-image:radial-gradient(circle_at_1px_1px,var(--grid-dot)_1px,transparent_0)] [background-size:24px_24px]" />
      <div className="relative mx-auto w-full max-w-6xl px-5 pb-6 sm:px-7 lg:px-8">
        <nav className={`flex h-14 items-center justify-between border-b border-border/80 transition-all duration-500 ${motion}`}>
          <div className="flex items-center gap-2.5"><div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm"><TimerReset className="size-3.5" /></div><div className="leading-none"><span className="block text-sm font-bold tracking-tight">SIF Tracker</span><span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Operations</span></div></div>
          <div className="flex items-center gap-3"><div className="text-right font-mono leading-none" aria-label="Philippine Standard Time"><span className="block text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground">PHT</span><time className="mt-1 block text-[10px] font-semibold tabular-nums sm:text-[11px]">{philippineDate}</time><time className="mt-0.5 block text-[11px] font-bold tabular-nums sm:text-xs">{philippineTime}</time></div><ThemeToggle /></div>
        </nav>

        <section className={`py-7 sm:py-9 transition-all duration-700 ${motion}`}><div className="max-w-3xl"><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"><span className="size-1.5 animate-pulse rounded-full bg-[var(--sif-green)]" />Production time calculator</div><h1 className="text-4xl font-bold tracking-[-0.06em] sm:text-5xl lg:text-6xl">Time, tracked simply.</h1><p className="mt-3 max-w-3xl text-sm leading-5 text-muted-foreground">Plan workload, run your shift, and keep today’s progress saved automatically.</p></div></section>

        <section id="calculator" className={`transition-all duration-700 ${motion}`}>
          <div className="mb-3 flex items-end justify-between gap-4"><div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">01 / Calculator</p><h2 className="mt-1 text-lg font-semibold tracking-tight">Enter your workload</h2></div><div className="font-mono text-[10px] text-muted-foreground">Auto-saved</div></div>
          <div className="grid gap-2.5 lg:grid-cols-2">
            {calculatedValues.map(({ workload, value }) => <article key={workload.id} className="group min-w-0 rounded-xl border border-border bg-card/85 p-3.5 shadow-[0_8px_28px_var(--card-shadow)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-2.5"><span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ backgroundColor: workload.accent }} /><div><h3 className="text-sm font-semibold tracking-tight">{workload.label}</h3><p className="mt-0.5 text-[10px] text-muted-foreground">{workload.minutesPerUnit} minutes per {workload.unit.slice(0, -1)}</p></div></div><output className="font-mono text-[15px] font-bold tabular-nums" style={{ color: workload.accent }}>{formatDuration((value ?? 0) * workload.minutesPerUnit * 60)}</output></div><label className="mt-3 block"><span className="mb-1 block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Number of {workload.unit}</span><div className="relative"><input type="text" inputMode="numeric" value={values[workload.id]} onChange={(event) => updateValue(workload.id, event.target.value)} placeholder="0" className="h-11 w-full rounded-lg border border-input bg-background/70 px-3 pr-14 font-mono text-[15px] font-medium tabular-nums outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />{value !== null && <output className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-[15px] font-semibold tabular-nums text-muted-foreground">{value}</output>}</div></label><div className="mt-2 flex gap-1.5"><span className="mr-auto self-center text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Quick add</span>{[1, 5, 10].map((amount) => <button key={amount} type="button" onClick={() => addQuickValue(workload.id, amount)} className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[9px] font-semibold hover:bg-accent">+{amount}</button>)}</div><div className="mt-2.5 grid grid-cols-2 gap-x-2 gap-y-1 border-t border-border pt-2.5 sm:grid-cols-4">{workload.examples.map((example) => <span key={example} className="font-mono text-[8px] font-semibold leading-3.5 tracking-tight text-muted-foreground">{example}</span>)}</div></article>)}

            <section id="workflow" className="rounded-xl border border-primary/15 bg-primary p-3.5 text-primary-foreground shadow-[0_8px_28px_var(--card-shadow)]"><div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center"><div><p className="text-[8px] font-bold uppercase tracking-[0.18em] opacity-70">02 / Workflow</p><h3 className="mt-1 text-base font-semibold tracking-tight">One total, all workloads.</h3><p className="mt-1 text-[10px] leading-4 opacity-75">{totalUnits || 0} total units across {workloads.length} workload types.</p></div><div className="text-left sm:text-right"><span className="block text-[8px] font-bold uppercase tracking-[0.16em] opacity-60">Combined total</span><strong className="mt-0.5 block whitespace-nowrap font-mono text-2xl font-bold tracking-[-0.04em] tabular-nums sm:text-3xl">{formatDuration(totalSeconds)}</strong><span className="mt-1 block text-[9px] opacity-60">Est. clock out: {estimatedClockOut ?? '—'}</span></div></div></section>
          </div>
        </section>

        <section id="finish-time" className="mt-5 rounded-xl border border-border bg-card/70 p-4 shadow-[0_8px_28px_var(--card-shadow)] backdrop-blur"><div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">03 / Shift control</p><h2 className="mt-1 text-base font-semibold tracking-tight">Clock in, track, clock out</h2></div><span className="font-mono text-[9px] text-muted-foreground">PHT · 24-hour · seconds</span></div><div className="grid gap-3 sm:grid-cols-3"><label><span className="mb-1 block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Clock in</span><input type="time" step="1" value={clockInTime} onChange={(e) => setClockInTime(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm tabular-nums outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" /></label><label><span className="mb-1 block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Clock out</span><input type="time" step="1" value={clockOutTime} onChange={(e) => setClockOutTime(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm tabular-nums outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" /></label><label><span className="mb-1 block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Break</span><select value={breakSeconds} onChange={(e) => setBreakSeconds(Number(e.target.value))} className="h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm tabular-nums outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"><option value={0}>00:00:00</option><option value={1800}>00:30:00</option><option value={3600}>01:00:00</option><option value={5400}>01:30:00</option><option value={7200}>02:00:00</option></select></label></div><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={clockIn} disabled={running} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[10px] font-bold text-primary-foreground disabled:opacity-50"><CirclePlay className="size-3.5" />Clock in</button>{running ? <button type="button" onClick={pauseTimer} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-[10px] font-bold hover:bg-accent"><CirclePause className="size-3.5" />Pause</button> : startedAt === null && pausedSeconds > 0 && !clockOutTime ? <button type="button" onClick={resumeTimer} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-[10px] font-bold hover:bg-accent"><CirclePlay className="size-3.5" />Resume</button> : null}<button type="button" onClick={clockOut} disabled={!running && pausedSeconds === 0} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-[10px] font-bold hover:bg-accent disabled:opacity-50"><Square className="size-3.5" />Clock out</button></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-lg border border-border bg-background/60 p-3"><span className="block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Live session</span><strong className="mt-1 block font-mono text-xl font-bold tabular-nums">{formatDuration(liveSessionSeconds)}</strong><span className="mt-1 block text-[9px] text-muted-foreground">{running ? 'Timer running' : 'Timer paused'}</span></div><div className="rounded-lg border border-border bg-background/60 p-3"><span className="block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Hours worked</span><strong className="mt-1 block font-mono text-xl font-bold tabular-nums">{formatDuration(workedSeconds)}</strong><span className="mt-1 block text-[9px] text-muted-foreground">Break deducted</span></div><div className="rounded-lg border border-border bg-background/60 p-3"><span className="block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Target</span><div className="mt-1 flex items-center gap-2"><input type="number" min="1" max="24" step="0.5" value={targetSeconds / 3600} onChange={(e) => setTargetSeconds(Math.max(1, Number(e.target.value || 0)) * 3600)} className="w-16 rounded border border-input bg-background px-2 py-1 font-mono text-sm tabular-nums outline-none" /><span className="text-[9px] text-muted-foreground">hours</span></div><span className="mt-1 block text-[9px] text-muted-foreground">{formatDuration(remainingSeconds)} remaining</span></div></div><div className="mt-3"><div className="mb-1 flex items-center justify-between text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground"><span>Shift progress</span><span>{Math.round(progress)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progress}%` }} /></div></div></section>

        <section id="history" className="mt-5 rounded-xl border border-border bg-card/70 p-4 shadow-[0_8px_28px_var(--card-shadow)] backdrop-blur"><div className="mb-3 flex items-end justify-between gap-4"><div><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">04 / History</p><h2 className="mt-1 text-base font-semibold tracking-tight">Recent sessions</h2></div>{history.length > 0 && <button type="button" onClick={clearHistory} className="inline-flex items-center gap-1 text-[9px] font-semibold text-muted-foreground hover:text-foreground"><Trash2 className="size-3" />Clear</button>}</div>{history.length === 0 ? <p className="py-3 text-[10px] text-muted-foreground">Clock out a session to build your history.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left"><thead className="border-b border-border text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground"><tr><th className="px-2 py-2">Date</th><th className="px-2 py-2">Workload</th><th className="px-2 py-2">Planned</th><th className="px-2 py-2">Worked</th></tr></thead><tbody>{history.map((item) => <tr key={item.id} className="border-b border-border/70 last:border-0"><td className="px-2 py-2 font-mono text-[9px] tabular-nums">{item.date}</td><td className="px-2 py-2 text-[9px] font-semibold">{item.workload}</td><td className="px-2 py-2 font-mono text-[9px] tabular-nums">{item.total}</td><td className="px-2 py-2 font-mono text-[9px] font-semibold tabular-nums">{item.worked}</td></tr>)}</tbody></table></div>}</section>

        <section id="about" className="mt-5 border-y border-border py-4"><div><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">05 / About</p><p className="mt-1 max-w-xl text-[10px] leading-4 text-muted-foreground"><span className="block">Built as a simple internal production planning tool.</span><span className="block">Type numbers or expressions such as <span className="font-mono text-foreground">4*3</span> directly into any field.</span></p></div><button type="button" onClick={reset} className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-semibold hover:bg-accent"><RotateCcw className="size-3" />Reset all<ArrowUpRight className="size-3 opacity-50" /></button></section>
        <footer className="flex flex-col gap-1 py-4 text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>SIF Tracker</span><span>Created by Nicole</span></footer>
      </div>
      <div className="mobile-total-bar" aria-live="polite"><div><span className="mobile-total-label">TOTAL</span><strong>{formatDuration(totalSeconds)}</strong></div><div className="mobile-total-meta"><span>{formatDuration(workedSeconds)}</span><span>Worked · {Math.round(progress)}%</span></div></div>
    </main>
  )
}
