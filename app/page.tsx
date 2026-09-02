'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Copy, Minus, Plus, RotateCcw, Settings2, TimerReset, X } from 'lucide-react'
import { ClockInPicker } from '@/components/clock-in-picker'
import { ThemeToggle } from '@/components/theme-toggle'
import { calculateValue, formatCompactDuration, formatDuration, formatMilitaryTime, getElapsedSeconds, isIncompleteExpression, timeToSeconds } from '@/lib/calculator'
import { DEFAULT_RATES, DEFAULT_WORKLOADS, getExampleAmounts, getUnitLabel } from '@/lib/workloads'

type RateMap = Record<string, number>
type Feedback = 'saved' | 'reset' | 'copied' | null

const EMPTY_VALUES = Object.fromEntries(DEFAULT_WORKLOADS.map(({ id }) => [id, '']))
const TIME_ZONE = 'Asia/Manila'
const RATE_STORAGE_KEY = 'sif-tracker-rates-v1'
const BREAK_SECONDS = 60 * 60

function getPhilippineParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(date)
  return Object.fromEntries(parts.map(({ type, value }) => [type, value])) as Record<string, string>
}

function formatPhilippineDate(date: Date) {
  return new Intl.DateTimeFormat('en-PH', { timeZone: TIME_ZONE, month: 'short', day: '2-digit', year: 'numeric' }).format(date)
}

function getCurrentClockIn() {
  const parts = getPhilippineParts(new Date())
  return `${parts.hour}:${parts.minute}:${parts.second}`
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
  const [philippineSeconds, setPhilippineSeconds] = useState(0)
  const [editingRate, setEditingRate] = useState<string | null>(null)
  const [rateDraft, setRateDraft] = useState('')
  const [mounted, setMounted] = useState(false)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])
  const shiftRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      const parts = getPhilippineParts(now)
      setPhilippineTime(`${parts.hour}:${parts.minute}:${parts.second}`)
      setPhilippineDate(formatPhilippineDate(now))
      setPhilippineSeconds(Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second))
    }

    updateClock()
    setClockInTime(getCurrentClockIn())
    setMounted(true)
    const interval = window.setInterval(updateClock, 1000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(RATE_STORAGE_KEY) ?? 'null')
      if (saved?.rates && typeof saved.rates === 'object') {
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
      window.localStorage.setItem(RATE_STORAGE_KEY, JSON.stringify({ rates: savedRates }))
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const active = document.activeElement
      const index = inputRefs.current.findIndex((input) => input === active)
      if (index < 0) return
      const id = DEFAULT_WORKLOADS[index].id

      if (event.key === 'Escape') {
        setValues((current) => ({ ...current, [id]: '' }))
        setSettingsOpen(false)
        setConfirmReset(false)
        return
      }

      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        shiftRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        inputRefs.current[index + 1]?.focus()
        return
      }

      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault()
        const delta = event.key === 'ArrowUp' ? 1 : -1
        setValues((currentValues) => {
          const current = calculateValue(currentValues[id] ?? '') ?? 0
          const next = Math.max(0, Math.round((current + delta) * 100) / 100)
          return { ...currentValues, [id]: String(next) }
        })
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const workloads = useMemo(() => DEFAULT_WORKLOADS.map((workload) => ({ ...workload, minutesPerUnit: rates[workload.id] ?? workload.minutesPerUnit })), [rates])
  const calculatedValues = useMemo(() => workloads.map((workload) => ({ workload, input: values[workload.id] ?? '', value: calculateValue(values[workload.id] ?? '') })), [values, workloads])
  const totalSeconds = useMemo(() => calculatedValues.reduce((total, { workload, value }) => total + Math.max(0, value ?? 0) * workload.minutesPerUnit * 60, 0), [calculatedValues])
  const totalUnits = useMemo(() => calculatedValues.reduce((total, { value }) => total + Math.max(0, value ?? 0), 0), [calculatedValues])

  const clockInSeconds = timeToSeconds(clockInTime)
  const estimatedClockOutSeconds = clockInSeconds === null || totalUnits === 0 ? null : clockInSeconds + totalSeconds + BREAK_SECONDS
  const shiftSeconds = totalUnits > 0 ? totalSeconds + BREAK_SECONDS : 0
  const elapsedShiftSeconds = clockInSeconds === null ? 0 : getElapsedSeconds(clockInSeconds, philippineSeconds)
  const shiftComplete = estimatedClockOutSeconds !== null && elapsedShiftSeconds >= shiftSeconds
  const timeLeftSeconds = estimatedClockOutSeconds === null || shiftComplete ? 0 : Math.max(0, shiftSeconds - elapsedShiftSeconds)
  const unsavedRates = useMemo(() => DEFAULT_WORKLOADS.some(({ id }) => rates[id] !== savedRates[id]), [rates, savedRates])
  const shiftStatus = totalUnits === 0 ? 'NOT STARTED' : shiftComplete ? 'SHIFT COMPLETE' : 'IN PROGRESS'

  const motion = mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
  const cardClass = 'rounded-xl border border-border bg-card/85 shadow-[0_8px_28px_var(--card-shadow)] backdrop-blur transition'

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

  function clearWorkload(id: string) {
    setValues((currentValues) => ({ ...currentValues, [id]: '' }))
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

  async function saveRates() {
    try { await fetch('/api/workloads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rates }) }) } catch { /* local storage fallback */ }
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

  function handleClockNow() {
    setClockInTime(philippineTime)
  }

  async function copyClockOut() {
    const value = formatMilitaryTime(estimatedClockOutSeconds)
    if (value === '—') return
    try { await navigator.clipboard.writeText(value); setFeedback('copied') } catch { setFeedback(null) }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 opacity-[0.20] [background-image:radial-gradient(circle_at_1px_1px,var(--grid-dot)_1px,transparent_0)] [background-size:24px_24px]" />
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6 sm:pb-8 lg:px-8">
        <nav className={`flex min-h-14 items-center justify-between gap-4 border-b border-border/70 ${motion}`}>
          <div className="flex min-w-0 items-center gap-2.5"><div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm"><TimerReset className="size-3.5" /></div><span className="truncate text-sm font-bold tracking-tight">SIF Tracker</span></div>
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3"><div className="hidden text-right sm:block"><span className="block text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">PHT Now</span><time className="block font-mono text-[10px] font-bold tabular-nums">{philippineTime}</time></div><time className="whitespace-nowrap font-mono text-[9px] font-semibold tabular-nums sm:hidden">{philippineTime} PHT</time><ThemeToggle /></div>
        </nav>

        <section id="live-status" aria-label="Live shift status" className={`${motion} sticky top-2 z-30 mt-2 rounded-xl border border-border bg-card/95 shadow-md backdrop-blur`}>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border sm:grid-cols-4">
            <div className="min-w-0 bg-card px-2.5 py-2 sm:px-3">
              <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Work</span>
              <strong className="mt-0.5 block truncate font-mono text-[11px] font-bold tabular-nums sm:text-xs">{formatDuration(totalSeconds)}</strong>
            </div>
            <div className="min-w-0 bg-card px-2.5 py-2 sm:px-3">
              <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Break</span>
              <strong className="mt-0.5 block font-mono text-[11px] font-bold tabular-nums sm:text-xs">01:00:00</strong>
            </div>
            <div className="min-w-0 bg-card px-2.5 py-2 sm:px-3">
              <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Clock Out</span>
              <strong className="mt-0.5 block truncate font-mono text-[11px] font-bold tabular-nums sm:text-xs">{formatMilitaryTime(estimatedClockOutSeconds)}</strong>
            </div>
            <div className="min-w-0 bg-primary px-2.5 py-2 text-primary-foreground sm:px-3">
              <span className="block text-[7px] font-bold uppercase tracking-[0.14em] opacity-70">Status</span>
              <strong className="mt-0.5 block truncate font-mono text-[10px] font-bold tabular-nums sm:text-xs">{shiftStatus}</strong>
            </div>
          </div>
        </section>

        <section className={`py-5 sm:py-6 ${motion}`}><div className="max-w-4xl"><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"><span className="size-1.5 animate-pulse rounded-full bg-[var(--sif-green)]" />Production time calculator</div><h1 className="text-4xl font-bold tracking-[-0.06em] sm:text-5xl lg:text-6xl">SIF Tracker</h1><p className="mt-1.5 text-sm leading-5 text-muted-foreground">Enter your workload. Get your total time and clock-out instantly.</p></div></section>

        <section id="calculator" className={motion}>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">01 / Calculator</p><h2 className="mt-1 text-lg font-semibold tracking-tight">Enter your workload</h2></div><button type="button" onClick={() => setSettingsOpen((open) => !open)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-semibold shadow-sm transition hover:border-primary/40 hover:bg-accent"><Settings2 className="size-3" />Settings{unsavedRates && <span className="size-1.5 rounded-full bg-primary" />}</button></div>

          {settingsOpen && <section id="settings" className={`${cardClass} mb-3 p-3.5`}><div className="mb-3 flex items-center justify-between"><div><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Settings</p><h3 className="mt-1 text-sm font-semibold">Workload rates</h3></div><button type="button" onClick={() => setSettingsOpen(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent" aria-label="Close settings"><X className="size-3.5" /></button></div><div className="grid gap-2 sm:grid-cols-2">{workloads.map((workload) => <div key={workload.id} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border bg-background/60 px-3 py-2.5"><div className="min-w-0"><span className="block truncate text-[10px] font-semibold">{workload.label}</span><span className="text-[8px] text-muted-foreground">Minutes per {workload.unit.slice(0, -1)}</span></div><div className="flex shrink-0 items-center gap-1.5"><button type="button" onClick={() => adjustRate(workload.id, -1)} className="flex size-8 items-center justify-center rounded-md border border-border bg-card hover:bg-accent" aria-label={`Decrease ${workload.label}`}><Minus className="size-3" /></button>{editingRate === workload.id ? <input autoFocus value={rateDraft} onChange={(event) => setRateDraft(event.target.value)} onBlur={() => commitRateEdit(workload.id)} onKeyDown={(event) => { if (event.key === 'Enter') commitRateEdit(workload.id); if (event.key === 'Escape') setEditingRate(null) }} className="h-8 w-14 rounded-md border border-input bg-background px-1 text-center font-mono text-sm font-bold" aria-label={`Edit ${workload.label} rate`} /> : <button type="button" onClick={() => beginRateEdit(workload.id)} className="w-12 rounded-md py-1 text-center font-mono text-sm font-bold hover:bg-accent" aria-label={`Edit ${workload.label} rate`}>{workload.minutesPerUnit}m</button>}<button type="button" onClick={() => adjustRate(workload.id, 1)} className="flex size-8 items-center justify-center rounded-md border border-border bg-card hover:bg-accent" aria-label={`Increase ${workload.label}`}><Plus className="size-3" /></button></div></div>)}</div><div className="mt-3 rounded-lg bg-background/50 px-3 py-2.5"><p className="text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Example</p><div className="mt-1.5 grid gap-1 sm:grid-cols-2">{workloads.map((workload) => <div key={workload.id} className="min-w-0 font-mono text-[8px] leading-3.5 text-muted-foreground"><span className="font-semibold text-foreground">{workload.label}:</span>{' '}{getExampleAmounts(workload).map((amount, index) => <span key={amount}>{index > 0 ? ' · ' : ''}{amount} = {formatCompactDuration(amount * workload.minutesPerUnit)}</span>)}</div>)}</div></div><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-[8px] text-muted-foreground">{unsavedRates ? 'Unsaved changes' : 'Saved rates are active.'}</span><div className="flex gap-2"><button type="button" onClick={resetRates} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-[9px] font-bold hover:bg-accent"><RotateCcw className="size-3" />Reset</button><button type="button" onClick={saveRates} className="rounded-md bg-primary px-3 py-1.5 text-[9px] font-bold text-primary-foreground hover:opacity-90">Save</button></div></div></section>}

          <div className="grid min-w-0 gap-2.5 lg:grid-cols-2">{calculatedValues.map(({ workload, input, value }, index) => { const hasInput = input.trim() !== ''; const incomplete = hasInput && isIncompleteExpression(input); const invalid = hasInput && value === null && !incomplete; const duration = value === null ? 0 : Math.max(0, value) * workload.minutesPerUnit * 60; return <article key={workload.id} data-workload-id={workload.id} className={`${cardClass} flex min-w-0 flex-col p-3.5 hover:border-primary/25`}><div className="flex min-w-0 items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-2.5"><span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ backgroundColor: workload.accent }} /><div className="min-w-0"><h3 className="truncate text-sm font-semibold tracking-tight">{workload.label}</h3><p className="mt-0.5 text-[10px] text-muted-foreground">{workload.minutesPerUnit} minutes per {workload.unit.slice(0, -1)}</p></div></div><div className="flex shrink-0 items-center gap-1.5"><output className="font-mono text-[15px] font-bold tabular-nums" style={{ color: workload.accent }}>{formatDuration(duration)}</output>{hasInput && <button type="button" onClick={() => clearWorkload(workload.id)} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={`Clear ${workload.label}`} title="Clear"><X className="size-3" /></button>}</div></div><div className="mt-3"><span className="mb-1 block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Number of {workload.unit}</span><div className="flex items-center gap-1.5"><button type="button" onClick={() => adjustQuantity(workload.id, -1)} className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-input bg-background/70 hover:bg-accent" aria-label={`Decrease ${workload.label} quantity`}><Minus className="size-3.5" /></button><div className="relative min-w-0 flex-1"><input ref={(element) => { inputRefs.current[index] = element }} type="text" inputMode="text" autoComplete="off" value={input} onChange={(event) => updateValue(workload.id, event.target.value)} className={`h-11 w-full min-w-0 rounded-lg border bg-background/70 px-3 pr-16 font-mono text-[15px] font-medium tabular-nums outline-none transition ${invalid ? 'border-destructive focus:ring-4 focus:ring-destructive/10' : 'border-input focus:border-primary focus:ring-4 focus:ring-primary/10'}`} aria-invalid={invalid} aria-label={`Number of ${workload.unit} for ${workload.label}`} />{value !== null && hasInput && <output className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-[15px] font-semibold tabular-nums text-muted-foreground opacity-60">{value}</output>}</div><button type="button" onClick={() => adjustQuantity(workload.id, 1)} className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-input bg-background/70 hover:bg-accent" aria-label={`Increase ${workload.label} quantity`}><Plus className="size-3.5" /></button></div>{invalid ? <p className="mt-1.5 text-[9px] font-medium text-destructive">Invalid expression</p> : incomplete ? <p className="mt-1.5 text-[9px] font-medium text-muted-foreground">Waiting for expression…</p> : hasInput ? <p className="mt-1.5 rounded-md bg-background/40 px-2.5 py-1.5 font-mono text-[9px] font-semibold text-muted-foreground">{input} = {value} {getUnitLabel(workload.unit, value ?? 0)} → {formatDuration(duration)}</p> : <p className="mt-1.5 text-[8px] text-muted-foreground/70">Enter a quantity or expression: 5+5 · 10*3 · (5+5)*2</p>}</div><div className="mt-auto grid grid-cols-2 gap-x-2 gap-y-1 border-t border-border pt-2.5 sm:grid-cols-4">{getExampleAmounts(workload).map((amount) => <span key={amount} className="font-mono text-[8px] font-semibold leading-3.5 tracking-tight text-muted-foreground">{getUnitLabel(workload.unit, amount)} = {formatCompactDuration(amount * workload.minutesPerUnit)}</span>)}</div></article> })}<section id="workflow" className="mt-0 rounded-xl border border-primary/20 bg-primary p-4 text-primary-foreground shadow-[0_12px_36px_var(--card-shadow)]"><div className="flex h-full flex-col justify-between gap-3 sm:flex-row sm:items-center"><div className="min-w-0"><p className="text-[8px] font-bold uppercase tracking-[0.18em] opacity-70">02 / Workflow</p><h3 className="mt-1 text-base font-semibold tracking-tight">One total, all workloads.</h3><p className="mt-1 text-[10px] leading-4 opacity-75">{totalUnits} total units across {workloads.length} workload types.</p></div><div className="min-w-0 text-left sm:text-right"><span className="block text-[8px] font-bold uppercase tracking-[0.16em] opacity-60">Total work time</span><strong className="mt-0.5 block whitespace-nowrap font-mono text-2xl font-bold tracking-[-0.04em] tabular-nums sm:text-3xl">{formatDuration(totalSeconds)}</strong></div></div></section></div>
        </section>

        <section ref={shiftRef} id="shift" className={`${cardClass} mt-4 p-4`}><div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">03 / Shift Summary</p><h2 className="mt-1 text-base font-semibold tracking-tight">Know when you’re done.</h2></div><div className="text-right"><p className="font-mono text-[8px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Today · {philippineDate}</p><p className="mt-0.5 text-[8px] text-muted-foreground">Fixed 01:00:00 break</p></div></div><div className="grid min-w-0 gap-2.5 sm:grid-cols-4"><div className="min-w-0 rounded-lg border border-border bg-background/60 p-3"><span className="block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Clock in</span><button type="button" className="mt-1.5 flex min-h-11 w-full items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 font-mono text-sm font-bold tabular-nums outline-none transition hover:border-primary/50 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Edit Clock In time, currently ${clockInTime}`}>{clockInTime || 'Choose time'}</button><input type="time" step="1" value={clockInTime} onChange={(event) => setClockInTime(event.target.value)} className="sr-only" tabIndex={-1} aria-hidden="true" /><div className="mt-2 flex justify-center"><button type="button" onClick={handleClockNow} className="rounded-full border border-border bg-card px-5 py-2 text-[10px] font-bold shadow-sm transition hover:border-primary/40 hover:bg-accent">NOW · {philippineTime}</button></div></div><div className="min-w-0 rounded-lg border border-border bg-background/60 p-3"><span className="block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Worked</span><strong className="mt-1 block font-mono text-lg font-bold tabular-nums">{formatDuration(totalSeconds)}</strong><span className="mt-1 block text-[8px] text-muted-foreground">Workload time only.</span></div><div className="min-w-0 rounded-lg border border-border bg-background/60 p-3"><span className="block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Break</span><strong className="mt-1 block font-mono text-lg font-bold tabular-nums">01:00:00</strong><span className="mt-1 block text-[8px] text-muted-foreground">Fixed 1-hour break.</span></div><div className={`min-w-0 rounded-xl border p-3 transition ${shiftComplete ? 'border-[var(--sif-green)]/50 bg-[var(--sif-green)]/10' : 'border-primary/45 bg-primary/10'}`}><div className="flex items-start justify-between gap-2"><div><span className={`block text-[8px] font-bold uppercase tracking-[0.15em] ${shiftComplete ? 'text-[var(--sif-green)]' : 'text-primary'}`}>Clock Out</span><strong className={`mt-1 block whitespace-nowrap font-mono text-2xl font-bold tracking-[-0.04em] tabular-nums sm:text-3xl ${shiftComplete ? 'text-[var(--sif-green)]' : 'text-primary'}`}>{formatMilitaryTime(estimatedClockOutSeconds)}</strong></div>{estimatedClockOutSeconds !== null && <button type="button" onClick={copyClockOut} className="rounded-md p-1.5 text-primary transition hover:bg-primary/10" aria-label="Copy Clock Out time" title="Copy Clock Out time"><Copy className="size-3.5" /></button>}</div><span className="mt-1 block text-[8px] text-muted-foreground">{estimatedClockOutSeconds === null ? 'Enter a workload to calculate' : shiftComplete ? '✓ SHIFT COMPLETE' : 'TIME UNTIL CLOCK OUT'}</span>{estimatedClockOutSeconds !== null && <strong className="mt-1.5 block font-mono text-xs font-bold tabular-nums text-primary">{shiftComplete ? '00:00:00' : formatDuration(timeLeftSeconds)}</strong>}</div></div></section>

        <section id="tools" className={`${cardClass} mt-4 bg-card/50 p-3.5 sm:flex sm:items-center sm:justify-between sm:gap-4`}><div className="min-w-0"><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">04 / Tools</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">Reset today’s workload without changing your saved rates.</p></div><button type="button" onClick={() => setConfirmReset(true)} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-2 text-[10px] font-semibold transition hover:border-primary/30 hover:bg-accent sm:mt-0 sm:w-auto"><RotateCcw className="size-3" />Reset workload</button></section>
        <footer className="flex flex-col gap-1 py-4 text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>SIF Tracker</span><span>Created by Nicole</span></footer>
      </div>

      {feedback && <div className="fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-[10px] font-semibold shadow-lg" role="status"><Check className="size-3 text-primary" />{feedback === 'saved' ? 'Rates saved' : feedback === 'reset' ? 'Workload reset' : 'Clock Out copied'}</div>}
      {confirmReset && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="reset-title" onMouseDown={(event) => { if (event.currentTarget === event.target) setConfirmReset(false) }}><div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Confirm reset</p><h3 id="reset-title" className="mt-1 text-sm font-semibold">Reset today’s workload?</h3><p className="mt-1.5 text-[10px] leading-4 text-muted-foreground">This clears all workload inputs and resets Clock In to the current PHT time. Your saved rates stay unchanged.</p></div><button type="button" onClick={() => setConfirmReset(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent" aria-label="Close reset confirmation"><X className="size-3.5" /></button></div><div className="mt-4 flex gap-2"><button type="button" onClick={() => setConfirmReset(false)} className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-[10px] font-bold hover:bg-accent">Cancel</button><button type="button" onClick={performReset} className="flex-1 rounded-md bg-primary px-3 py-2 text-[10px] font-bold text-primary-foreground hover:opacity-90">Reset</button></div></div></div>}
      <ClockInPicker />
    </main>
  )
}
