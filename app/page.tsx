'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Eraser, HelpCircle, RotateCcw, Settings2, TimerReset, X } from 'lucide-react'
import { ClockInPicker } from '@/components/clock-in-picker'
import { PhtClockDisplay } from '@/components/pht-clock-display'
import { ThemeToggle } from '@/components/theme-toggle'
import { WorkloadCard } from '@/components/workload-card'
import { WorkloadSettings } from '@/components/workload-settings'
import { calculateValue, formatDuration, formatMilitaryTime } from '@/lib/calculator'
import { loadSavedRates, persistSavedRates } from '@/lib/rates-storage'
import { calculateShift, calculateWorkloads } from '@/lib/shift'
import { getCurrentClockIn, usePhilippineClock } from '@/lib/use-philippine-clock'
import { DEFAULT_RATES, DEFAULT_WORKLOADS } from '@/lib/workloads'

type RateMap = Record<string, number>
type Feedback = 'saved' | 'cleared' | 'reset' | null
type ApiStatus = 'checking' | 'ready' | 'error'

const EMPTY_VALUES = Object.fromEntries(DEFAULT_WORKLOADS.map(({ id }) => [id, '']))
const CARD_CLASS = 'rounded-2xl border border-border bg-card/60'

export default function Page() {
  const [values, setValues] = useState<Record<string, string>>({ ...EMPTY_VALUES })
  const [rates, setRates] = useState<RateMap>(() => ({ ...DEFAULT_RATES }))
  const [savedRates, setSavedRates] = useState<RateMap>(() => ({ ...DEFAULT_RATES }))
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking')
  const [clockInTime, setClockInTime] = useState('')
  const [editingRate, setEditingRate] = useState<string | null>(null)
  const [rateDraft, setRateDraft] = useState('')
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])
  const { seconds: nowSeconds, time: currentTime } = usePhilippineClock()

  useEffect(() => {
    const hydrate = window.setTimeout(() => {
      const saved = loadSavedRates()
      setRates(saved)
      setSavedRates(saved)
      setClockInTime(getCurrentClockIn())
    }, 0)
    return () => window.clearTimeout(hydrate)
  }, [])

  useEffect(() => {
    let active = true
    const checkWorkloadApi = async () => {
      try {
        const response = await fetch('/api/workloads', { cache: 'no-store' })
        if (!response.ok) throw new Error(`Workload API returned ${response.status}`)
        const payload = await response.json()
        if (!payload?.ok || !payload?.rates) throw new Error('Invalid workload API response')
        if (active) setApiStatus('ready')
      } catch {
        if (active) setApiStatus('error')
      }
    }
    checkWorkloadApi()
    return () => { active = false }
  }, [])

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
  const { calculatedValues, totalSeconds, totalUnits } = useMemo(
    () => calculateWorkloads(workloads, values),
    [values, workloads],
  )
  const unsavedRates = useMemo(
    () => DEFAULT_WORKLOADS.some(({ id }) => rates[id] !== savedRates[id]),
    [rates, savedRates],
  )
  const shift = useMemo(
    () => calculateShift(clockInTime, totalSeconds, totalUnits, nowSeconds),
    [clockInTime, nowSeconds, totalSeconds, totalUnits],
  )
  const hasClockIn = clockInTime !== ''
  const progress = shift.shiftSeconds > 0 ? Math.min(100, Math.round((shift.elapsedShiftSeconds / shift.shiftSeconds) * 100)) : 0
  const clockOut = formatMilitaryTime(shift.estimatedClockOutSeconds)

  function updateValue(id: string, nextValue: string) {
    if (/^[\d+*/().=\s-]*$/.test(nextValue)) setValues((current) => ({ ...current, [id]: nextValue }))
  }
  function adjustQuantity(id: string, delta: number) {
    const current = calculateValue(values[id] ?? '') ?? 0
    const next = Math.max(0, Math.round((current + delta) * 100) / 100)
    setValues((currentValues) => ({ ...currentValues, [id]: String(next) }))
  }
  function clearWorkload(id: string) { setValues((currentValues) => ({ ...currentValues, [id]: '' })) }
  function clearAllWorkloads() { setValues({ ...EMPTY_VALUES }); setFeedback('cleared'); inputRefs.current[0]?.focus() }
  function adjustRate(id: string, delta: number) { setRates((current) => ({ ...current, [id]: Math.max(1, Math.min(240, (current[id] ?? DEFAULT_RATES[id]) + delta)) })) }
  function beginRateEdit(id: string) { setEditingRate(id); setRateDraft(String(rates[id] ?? DEFAULT_RATES[id])) }
  function commitRateEdit(id: string) {
    const parsed = Number(rateDraft.replace(/m/gi, '').trim())
    if (Number.isFinite(parsed)) setRates((current) => ({ ...current, [id]: Math.max(1, Math.min(240, Math.round(parsed))) }))
    setEditingRate(null); setRateDraft('')
  }
  function cancelRateEdit() { setEditingRate(null); setRateDraft('') }
  function resetRates() { const defaults = { ...DEFAULT_RATES }; setRates(defaults); setSavedRates(defaults); persistSavedRates(defaults); setFeedback('saved') }
  function saveRates() { if (!persistSavedRates(rates)) return; setSavedRates({ ...rates }); setSettingsOpen(false); setFeedback('saved') }
  function performReset() { setValues({ ...EMPTY_VALUES }); setClockInTime(getCurrentClockIn()); setConfirmReset(false); setFeedback('reset'); inputRefs.current[0]?.focus() }
  function openQuickGuide() { window.dispatchEvent(new Event('sif:open-welcome')) }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 2xl:max-w-[100rem] min-[1920px]:max-w-[120rem]">
        <header className="sticky top-0 z-40 -mx-4 border-b border-border/70 bg-background/95 px-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex min-h-14 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2.5"><div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"><TimerReset className="size-3.5" /></div><div className="min-w-0"><p className="truncate text-sm font-bold tracking-tight">SIF Tracker</p><p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Daily workload</p></div></div>
            <div className="flex items-center gap-2 sm:gap-3"><div className="hidden sm:block"><PhtClockDisplay /></div><button type="button" onClick={openQuickGuide} className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1.5 text-[9px] font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Open Quick Guide"><HelpCircle className="size-3" /><span className="hidden sm:inline">Quick Guide</span></button><ThemeToggle /></div>
          </div>
        </header>
        {apiStatus === 'error' && <div className="mt-3 rounded-xl border border-border bg-card/60 px-3 py-2.5 text-[10px] font-medium text-muted-foreground" role="alert">Live workload configuration is unavailable. SIF Tracker is using your local saved rates.</div>}

        <div className="mx-auto mt-6 w-full max-w-7xl space-y-7 2xl:max-w-[100rem] min-[1920px]:max-w-[120rem]">
          <section id="shift-summary" className="grid grid-cols-2 gap-1 sm:grid-cols-5" aria-label="Shift summary"><SummaryTile label="Progress" value={hasClockIn ? `${progress}%` : '—'} progress={hasClockIn ? progress : 0} /><SummaryTile label="Worked" value={hasClockIn ? formatDuration(shift.elapsedShiftSeconds) : '—'} /><SummaryTile label="Total Hours" value={totalUnits > 0 ? formatDuration(totalSeconds) : '—'} /><SummaryTile label="Break" value={hasClockIn && totalUnits > 0 ? '01:00:00' : '—'} /><SummaryTile label="Clock Out" value={clockOut} accent /></section>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr] lg:items-stretch">
            <section id="calculator" className="flex scroll-mt-20 flex-col" aria-labelledby="workload-heading">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">01 / Workload</p><h2 id="workload-heading" className="mt-1 text-xl font-semibold tracking-tight">Today&apos;s workload</h2><p className="mt-1 text-[9px] leading-4 text-muted-foreground">Enter a quantity or expression. Enter → next · ↑ ↓ adjust.</p></div><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={clearAllWorkloads} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[9px] font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Clear all workload inputs"><Eraser className="size-3" />Clear all</button><button type="button" onClick={() => setSettingsOpen((open) => !open)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[9px] font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-expanded={settingsOpen} aria-controls="settings"><Settings2 className="size-3" />Settings{unsavedRates && <span className="size-1.5 rounded-full bg-primary" aria-label="Unsaved changes" />}</button></div></div>
              {settingsOpen && <div className="mb-5"><WorkloadSettings workloads={workloads} rates={rates} savedRates={savedRates} editingRate={editingRate} rateDraft={rateDraft} onAdjust={adjustRate} onBeginEdit={beginRateEdit} onDraftChange={setRateDraft} onCommitEdit={commitRateEdit} onCancelEdit={cancelRateEdit} onReset={resetRates} onSave={saveRates} onClose={() => setSettingsOpen(false)} /></div>}
              <div className="flex-1"><WorkloadCard calculatedValues={calculatedValues} totalSeconds={totalSeconds} inputRefs={inputRefs} onChange={updateValue} onAdjust={adjustQuantity} onClear={clearWorkload} onNext={(index) => inputRefs.current[index + 1]?.focus()} /></div>
            </section>

            <section id="clock-in" className={`${CARD_CLASS} scroll-mt-20 flex flex-col p-5`} aria-labelledby="clock-in-heading">
              <div><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">02 / Clock In</p><h2 id="clock-in-heading" className="mt-1 text-sm font-semibold">Clock In</h2><p className="mt-1 text-[9px] leading-4 text-muted-foreground">Set or edit your start time for today&apos;s shift.</p></div>
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
                <time className="font-mono text-5xl font-bold tabular-nums tracking-tight text-foreground" suppressHydrationWarning>{currentTime}</time>
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Philippine Standard Time</p>
                <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-semibold ${hasClockIn ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>
                  <span className={`size-1.5 rounded-full ${hasClockIn ? 'bg-primary' : 'bg-muted-foreground'}`} aria-hidden="true" />
                  {hasClockIn ? `Clocked in at ${clockInTime} · ${formatDuration(shift.elapsedShiftSeconds)} elapsed` : 'Not clocked in yet'}
                </div>
              </div>

              <div className="flex flex-col gap-2"><button type="button" onClick={() => window.dispatchEvent(new Event('sif:edit-clock-in'))} className="inline-flex w-full items-center justify-center rounded-full border border-border px-4 py-2.5 text-[9px] font-bold text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Edit Clock In time, currently ${clockInTime || 'Choose time'}`}>Edit Clock In · {clockInTime || 'Choose time'}</button><button type="button" onClick={() => setClockInTime(getCurrentClockIn())} className="inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-[9px] font-bold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Set Clock In to current PHT time ${currentTime}`}>NOW · {currentTime}</button></div>
            </section>
          </div>

          <section id="tools" className={`${CARD_CLASS} scroll-mt-20 p-4`} aria-labelledby="tools-heading"><div><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">03 / Tools</p><h2 id="tools-heading" className="mt-1 text-sm font-semibold">Daily controls</h2><p className="mt-1 text-[9px] leading-4 text-muted-foreground">Manage today&apos;s workload.</p></div><button type="button" onClick={() => setConfirmReset(true)} className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border px-3 py-2 text-[9px] font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><RotateCcw className="size-3" />Reset today&apos;s workload</button></section>
          <footer className="flex flex-col gap-1 border-t border-border pt-4 text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>SIF Tracker</span><span>Created by Nicole</span></footer>
        </div>
      </div>
      {feedback && <div className="fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-[10px] font-semibold shadow-lg" role="status"><Check className="size-3 text-primary" />{feedback === 'saved' ? 'Rates saved' : feedback === 'reset' ? 'Workload reset' : 'All workloads cleared'}</div>}
      {confirmReset && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="reset-title" onMouseDown={(event) => { if (event.currentTarget === event.target) setConfirmReset(false) }}><div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Confirm reset</p><h3 id="reset-title" className="mt-1 text-sm font-semibold">Reset today&apos;s workload?</h3><p className="mt-2 text-[10px] leading-5 text-muted-foreground">This clears all quantities and resets Clock In to the current PHT time.</p></div><button type="button" onClick={() => setConfirmReset(false)} className="rounded-full p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground" aria-label="Close reset confirmation"><X className="size-4" /></button></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setConfirmReset(false)} className="rounded-full border border-border px-4 py-2 text-[9px] font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground">Cancel</button><button type="button" onClick={performReset} className="rounded-full bg-primary px-4 py-2 text-[9px] font-bold text-primary-foreground transition hover:bg-primary/90">Reset</button></div></div></div>}
      <ClockInPicker value={clockInTime} onChange={setClockInTime} />
    </main>
  )
}

function SummaryTile({ label, value, accent = false, progress }: { label: string; value: string; accent?: boolean; progress?: number }) {
  return <div className={`rounded-xl border ${accent ? 'border-primary/40 bg-primary/5' : 'border-border bg-card/60'} px-3.5 py-3`}><p className="text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className={`mt-1 font-mono text-sm font-bold tabular-nums tracking-tight ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</p>{progress !== undefined && <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true"><div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} /></div>}</div>
}
