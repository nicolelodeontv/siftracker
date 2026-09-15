'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Eraser, HelpCircle, RotateCcw, Settings2, TimerReset, X } from 'lucide-react'
import { ClockInPicker } from '@/components/clock-in-picker'
import { TodaySnapshot } from '@/components/today-snapshot'
import { PhtClockDisplay } from '@/components/pht-clock-display'
import { ThemeToggle } from '@/components/theme-toggle'
import { WorkloadCard } from '@/components/workload-card'
import { WorkloadSettings } from '@/components/workload-settings'
import { calculateValue } from '@/lib/calculator'
import { loadSavedRates, persistSavedRates } from '@/lib/rates-storage'
import { calculateWorkloads } from '@/lib/shift'
import { getCurrentClockIn } from '@/lib/use-philippine-clock'
import { DEFAULT_RATES, DEFAULT_WORKLOADS } from '@/lib/workloads'

type RateMap = Record<string, number>
type Feedback = 'saved' | 'cleared' | 'reset' | null

const EMPTY_VALUES = Object.fromEntries(DEFAULT_WORKLOADS.map(({ id }) => [id, '']))

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Page() {
  const [values, setValues] = useState<Record<string, string>>({ ...EMPTY_VALUES })
  const [rates, setRates] = useState<RateMap>(() => ({ ...DEFAULT_RATES }))
  const [savedRates, setSavedRates] = useState<RateMap>(() => ({ ...DEFAULT_RATES }))
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [clockInTime, setClockInTime] = useState('00:00:00')
  const [editingRate, setEditingRate] = useState<string | null>(null)
  const [rateDraft, setRateDraft] = useState('')
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

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
  const activeWorkloadCount = calculatedValues.filter(({ value }) => Math.max(0, value ?? 0) > 0).length
  const unsavedRates = useMemo(
    () => DEFAULT_WORKLOADS.some(({ id }) => rates[id] !== savedRates[id]),
    [rates, savedRates],
  )

  function updateValue(id: string, nextValue: string) {
    if (/^[\d+*/().=\s-]*$/.test(nextValue)) {
      setValues((current) => ({ ...current, [id]: nextValue }))
    }
  }

  function adjustQuantity(id: string, delta: number) {
    const current = calculateValue(values[id] ?? '') ?? 0
    const next = Math.max(0, Math.round((current + delta) * 100) / 100)
    setValues((currentValues) => ({ ...currentValues, [id]: String(next) }))
  }

  function clearWorkload(id: string) {
    setValues((currentValues) => ({ ...currentValues, [id]: '' }))
  }

  function clearAllWorkloads() {
    setValues({ ...EMPTY_VALUES })
    setFeedback('cleared')
    inputRefs.current[0]?.focus()
  }

  function adjustRate(id: string, delta: number) {
    setRates((current) => ({
      ...current,
      [id]: Math.max(1, Math.min(240, (current[id] ?? DEFAULT_RATES[id]) + delta)),
    }))
  }

  function beginRateEdit(id: string) {
    setEditingRate(id)
    setRateDraft(String(rates[id] ?? DEFAULT_RATES[id]))
  }

  function commitRateEdit(id: string) {
    const parsed = Number(rateDraft.replace(/m/gi, '').trim())
    if (Number.isFinite(parsed)) {
      setRates((current) => ({
        ...current,
        [id]: Math.max(1, Math.min(240, Math.round(parsed))),
      }))
    }
    setEditingRate(null)
    setRateDraft('')
  }

  function cancelRateEdit() {
    setEditingRate(null)
    setRateDraft('')
  }

  function resetRates() {
    const defaults = { ...DEFAULT_RATES }
    setRates(defaults)
    setSavedRates(defaults)
    persistSavedRates(defaults)
    setFeedback('saved')
  }

  function saveRates() {
    if (!persistSavedRates(rates)) return
    setSavedRates({ ...rates })
    setSettingsOpen(false)
    setFeedback('saved')
  }

  function performReset() {
    setValues({ ...EMPTY_VALUES })
    setClockInTime(getCurrentClockIn())
    setConfirmReset(false)
    setFeedback('reset')
    inputRefs.current[0]?.focus()
  }

  function openQuickGuide() {
    window.dispatchEvent(new Event('sif:open-welcome'))
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-40 -mx-4 border-b border-border/70 bg-background/95 px-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex min-h-14 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <TimerReset className="size-3.5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold tracking-tight">SIF Tracker</p>
                <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Daily workload</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:block"><PhtClockDisplay /></div>
              <button type="button" onClick={openQuickGuide} className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1.5 text-[9px] font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Open Quick Guide">
                <HelpCircle className="size-3" />
                <span className="hidden sm:inline">Quick Guide</span>
              </button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <section className="py-10 sm:py-14">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">SIF / Production</p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.06em] sm:text-5xl">Plan your shift.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Enter today&apos;s workload, then use the shift result below to see when you are expected to finish.</p>
        </section>

        <div className="lg:grid lg:grid-cols-[1.5fr_1fr] lg:items-start lg:gap-8">
          <section id="calculator" className="scroll-mt-20" aria-labelledby="workload-heading">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">01 / Workload</p>
                <h2 id="workload-heading" className="mt-1 text-xl font-semibold tracking-tight">Today&apos;s workload</h2>
                <p className="mt-1 text-[9px] leading-4 text-muted-foreground">Enter a quantity or expression. Enter → next · ↑ ↓ adjust.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={clearAllWorkloads} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[9px] font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Clear all workload inputs">
                  <Eraser className="size-3" />
                  Clear all
                </button>
                <button type="button" onClick={() => setSettingsOpen((open) => !open)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[9px] font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-expanded={settingsOpen} aria-controls="settings">
                  <Settings2 className="size-3" />
                  Settings
                  {unsavedRates && <span className="size-1.5 rounded-full bg-primary" aria-label="Unsaved changes" />}
                </button>
              </div>
            </div>

            {settingsOpen && (
              <div className="mb-6">
                <WorkloadSettings workloads={workloads} rates={rates} savedRates={savedRates} editingRate={editingRate} rateDraft={rateDraft} onAdjust={adjustRate} onBeginEdit={beginRateEdit} onDraftChange={setRateDraft} onCommitEdit={commitRateEdit} onCancelEdit={cancelRateEdit} onReset={resetRates} onSave={saveRates} onClose={() => setSettingsOpen(false)} />
              </div>
            )}

            <WorkloadCard calculatedValues={calculatedValues} totalSeconds={totalSeconds} inputRefs={inputRefs} onChange={updateValue} onAdjust={adjustQuantity} onClear={clearWorkload} onNext={(index) => inputRefs.current[index + 1]?.focus()} />
          </section>

          <div className="my-12 h-px bg-border lg:hidden" />

          <div className="lg:sticky lg:top-20 lg:self-start">
            <TodaySnapshot totalSeconds={totalSeconds} totalUnits={totalUnits} activeWorkloads={workloads.length} activeWorkloadCount={activeWorkloadCount} clockInTime={clockInTime} calculatedValues={calculatedValues} onClockInChange={setClockInTime} />

            <section id="tools" className="mt-12 scroll-mt-20 border-t border-border pt-8" aria-labelledby="tools-heading">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">03 / Tools</p>
                  <h2 id="tools-heading" className="mt-1 text-sm font-semibold">Daily controls</h2>
                  <p className="mt-1 text-[9px] leading-4 text-muted-foreground">Reset inputs and Clock In without changing saved rates.</p>
                </div>
                <button type="button" onClick={() => setConfirmReset(true)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[9px] font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <RotateCcw className="size-3" />
                  Reset today&apos;s workload
                </button>
              </div>
            </section>
          </div>
        </div>

        <footer className="mt-12 flex flex-col gap-1 border-t border-border pt-5 text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>SIF Tracker</span>
          <span>Created by Nicole</span>
        </footer>
      </div>

      {feedback && (
        <div className="fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-[10px] font-semibold shadow-lg" role="status">
          <Check className="size-3 text-primary" />
          {feedback === 'saved' ? 'Rates saved' : feedback === 'reset' ? 'Workload reset' : 'All workloads cleared'}
        </div>
      )}

      {confirmReset && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="reset-title" onMouseDown={(event) => { if (event.currentTarget === event.target) setConfirmReset(false) }}>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Confirm reset</p>
                <h3 id="reset-title" className="mt-1 text-sm font-semibold">Reset workload?</h3>
                <p className="mt-1.5 text-[10px] leading-4 text-muted-foreground">This clears today&apos;s workload inputs and resets Clock In to the current PHT time. Saved rates stay unchanged.</p>
              </div>
              <button type="button" onClick={() => setConfirmReset(false)} className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Close reset confirmation"><X className="size-3.5" /></button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setConfirmReset(false)} className="rounded-lg border border-border px-3 py-2 text-[10px] font-bold text-muted-foreground transition hover:bg-accent hover:text-foreground">Cancel</button>
              <button type="button" onClick={performReset} className="rounded-lg bg-primary px-3 py-2 text-[10px] font-bold text-primary-foreground transition hover:opacity-90">Reset</button>
            </div>
          </div>
        </div>
      )}

      <ClockInPicker value={clockInTime} onChange={setClockInTime} />
    </main>
  )
}
