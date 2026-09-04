'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Eraser, HelpCircle, RotateCcw, Settings2, TimerReset, X } from 'lucide-react'
import { ClockInPicker } from '@/components/clock-in-picker'
import { TodaySnapshot } from '@/components/today-snapshot'
import { PhtClockDisplay } from '@/components/pht-clock-display'
import { ThemeToggle } from '@/components/theme-toggle'
import { WorkloadCard } from '@/components/workload-card'
import { WorkloadSettings } from '@/components/workload-settings'
import { calculateValue, formatDuration } from '@/lib/calculator'
import { loadSavedRates, persistSavedRates } from '@/lib/rates-storage'
import { calculateWorkloads } from '@/lib/shift'
import { getCurrentClockIn } from '@/lib/use-philippine-clock'
import { DEFAULT_RATES, DEFAULT_WORKLOADS } from '@/lib/workloads'

type RateMap = Record<string, number>
type Feedback = 'saved' | 'cleared' | 'reset' | null

const EMPTY_VALUES = Object.fromEntries(DEFAULT_WORKLOADS.map(({ id }) => [id, '']))
const CARD_CLASS = 'rounded-xl border border-border bg-card/85 shadow-[0_8px_28px_var(--card-shadow)] backdrop-blur'

function scrollToWorkflow() {
  document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
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

  function adjustRate(id: string, delta: number) {
    setRates((current) => ({
      ...current,
      [id]: Math.max(1, Math.min(240, (current[id] ?? DEFAULT_RATES[id]) + delta)),
    }))
  }

  function clearWorkload(id: string) {
    setValues((currentValues) => ({ ...currentValues, [id]: '' }))
  }

  function clearAllWorkloads() {
    setValues({ ...EMPTY_VALUES })
    setFeedback('cleared')
    inputRefs.current[0]?.focus()
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
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6 sm:pb-8 lg:px-8">
        <nav className="flex min-h-14 items-center justify-between gap-4 border-b border-border/70">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <TimerReset className="size-3.5" />
            </div>
            <span className="truncate text-sm font-bold tracking-tight">SIF Tracker</span>
          </div>
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <PhtClockDisplay />
            <button type="button" onClick={openQuickGuide} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1.5 text-[9px] font-bold shadow-sm transition hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Open Quick Guide">
              <HelpCircle className="size-3" />
              <span className="hidden sm:inline">Quick Guide</span>
            </button>
            <ThemeToggle />
          </div>
        </nav>

        <section className="py-5 sm:py-6">
          <div className="max-w-4xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <span className="size-1.5 animate-pulse rounded-full bg-[var(--sif-green)]" />
              Production time calculator
            </div>
            <h1 className="text-4xl font-bold tracking-[-0.06em] sm:text-5xl lg:text-6xl">SIF Tracker</h1>
            <p className="mt-1.5 text-sm leading-5 text-muted-foreground">Enter your workload. Get your total time and clock-out instantly.</p>
          </div>
        </section>

        <section id="calculator">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">01 / Calculator</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight">Enter your workload</h2>
              <p className="mt-1 text-[8px] font-medium leading-4 text-muted-foreground/70">⌨ Enter → next · ↑ ↓ adjust · Ctrl/Cmd+Enter → summary</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 sm:shrink-0">
              <button type="button" onClick={clearAllWorkloads} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1.5 text-[10px] font-semibold shadow-sm transition hover:border-primary/30 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Clear all workload inputs">
                <Eraser className="size-3" />
                Clear all
              </button>
              <button type="button" onClick={() => setSettingsOpen((open) => !open)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-semibold shadow-sm transition hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-expanded={settingsOpen} aria-controls="settings">
                <Settings2 className="size-3" />
                Settings
                {unsavedRates && <span className="size-1.5 rounded-full bg-primary" aria-label="Unsaved changes" />}
              </button>
            </div>
          </div>

          {settingsOpen && (
            <WorkloadSettings
              workloads={workloads}
              rates={rates}
              savedRates={savedRates}
              editingRate={editingRate}
              rateDraft={rateDraft}
              onAdjust={adjustRate}
              onBeginEdit={beginRateEdit}
              onDraftChange={setRateDraft}
              onCommitEdit={commitRateEdit}
              onCancelEdit={cancelRateEdit}
              onReset={resetRates}
              onSave={saveRates}
              onClose={() => setSettingsOpen(false)}
            />
          )}

          <div className="grid min-w-0 gap-2.5 lg:grid-cols-2">
            {calculatedValues.map(({ workload, input }, index) => (
              <WorkloadCard
                key={workload.id}
                workload={workload}
                input={input}
                totalSeconds={totalSeconds}
                inputRef={(element) => {
                  inputRefs.current[index] = element
                }}
                onChange={(nextValue) => updateValue(workload.id, nextValue)}
                onAdjust={(delta) => adjustQuantity(workload.id, delta)}
                onClear={() => clearWorkload(workload.id)}
                onNext={() => inputRefs.current[index + 1]?.focus()}
                onSummaryShortcut={scrollToWorkflow}
              />
            ))}

            <section id="workflow" className={`${CARD_CLASS} rounded-xl border-primary/40 bg-card p-4 shadow-[0_12px_36px_var(--card-shadow)]`}>
              <div className="flex h-full flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <p className="text-[8px] font-bold uppercase tracking-[0.18em] opacity-70">02 / Workflow</p>
                  <h3 className="mt-1 text-base font-semibold tracking-tight">One total, all workloads.</h3>
                  <p className="mt-1 text-[10px] leading-4 opacity-75">{totalUnits} total units across {workloads.length} workload types.</p>
                </div>
                <div className="min-w-0 text-left sm:text-right">
                  <span className="block text-[8px] font-bold uppercase tracking-[0.16em] opacity-60">Total work time</span>
                  <strong aria-live="polite" className="mt-0.5 block whitespace-nowrap font-mono text-2xl font-bold tracking-[-0.04em] tabular-nums sm:text-3xl">{formatDuration(totalSeconds)}</strong>
                </div>
              </div>
            </section>
          </div>
        </section>

        <TodaySnapshot totalSeconds={totalSeconds} totalUnits={totalUnits} activeWorkloads={workloads.length} activeWorkloadCount={activeWorkloadCount} clockInTime={clockInTime} calculatedValues={calculatedValues} />

        <section id="tools" className={`${CARD_CLASS} mt-4 bg-card/50 p-3.5 sm:flex sm:items-center sm:justify-between sm:gap-4`}>
          <div className="min-w-0">
            <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">04 / Tools</p>
            <p className="mt-1 text-[10px] leading-4 text-muted-foreground">Reset today’s workload without changing your saved rates.</p>
          </div>
          <button type="button" onClick={() => setConfirmReset(true)} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-2 text-[10px] font-semibold transition hover:border-primary/30 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:mt-0 sm:w-auto">
            <RotateCcw className="size-3" />
            Reset today’s workload
          </button>
        </section>

        <footer className="flex flex-col gap-1 py-4 text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
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
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Confirm reset</p>
                <h3 id="reset-title" className="mt-1 text-sm font-semibold">Reset today’s workload?</h3>
                <p className="mt-1.5 text-[10px] leading-4 text-muted-foreground">This clears all workload inputs and resets Clock In to the current PHT time. Your saved rates stay unchanged.</p>
              </div>
              <button type="button" onClick={() => setConfirmReset(false)} className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Close reset confirmation">
                <X className="size-3.5" />
              </button>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setConfirmReset(false)} className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-[10px] font-bold hover:bg-accent">Cancel</button>
              <button type="button" onClick={performReset} className="flex-1 rounded-md bg-primary px-3 py-2 text-[10px] font-bold text-primary-foreground hover:opacity-90">Reset</button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 p-2 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <button type="button" onClick={scrollToWorkflow} className="flex-1 rounded-lg bg-primary px-3 py-2.5 text-[10px] font-bold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">View progress</button>
          <button type="button" onClick={() => setConfirmReset(true)} className="rounded-lg border border-border bg-background px-3 py-2.5 text-[10px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Reset</button>
          <button type="button" onClick={() => setSettingsOpen((open) => !open)} className="rounded-lg border border-border bg-background px-3 py-2.5 text-[10px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Toggle settings">Settings</button>
        </div>
      </div>

      <ClockInPicker value={clockInTime} onChange={setClockInTime} />
    </main>
  )
}
