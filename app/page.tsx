'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Eraser, Gauge, HelpCircle, LayoutDashboard, RotateCcw, Settings2, TimerReset, Wrench, X } from 'lucide-react'
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
const CARD_CLASS = 'rounded-2xl border border-border bg-card/90 shadow-[0_10px_32px_var(--card-shadow)] backdrop-blur'

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function scrollToWorkflow() {
  scrollTo('workflow')
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
    <main className="min-h-screen overflow-x-clip bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px]">
        <aside className="dashboard-sidebar sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-card/55 backdrop-blur lg:flex">
          <div className="flex items-center gap-2.5 px-5 py-5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <TimerReset className="size-4" />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-sm font-bold tracking-tight">SIF Tracker</span>
              <span className="block text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Operations</span>
            </div>
          </div>

          <nav className="flex-1 px-3 pt-4" aria-label="Dashboard navigation">
            <p className="px-3 pb-2 text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">Workspace</p>
            <div className="space-y-1">
              <DashboardNavButton icon={<LayoutDashboard className="size-3.5" />} label="Live Shift" onClick={() => scrollTo('dashboard')} />
              <DashboardNavButton icon={<Gauge className="size-3.5" />} label="Workload" onClick={() => scrollTo('calculator')} />
              <DashboardNavButton icon={<TimerReset className="size-3.5" />} label="Summary" onClick={scrollToWorkflow} />
              <DashboardNavButton icon={<Wrench className="size-3.5" />} label="Tools" onClick={() => scrollTo('tools')} />
            </div>
          </nav>

          <div className="border-t border-border p-4">
            <div className="rounded-xl border border-border bg-background/45 p-3">
              <p className="text-[7px] font-bold uppercase tracking-[0.16em] text-muted-foreground">PHT clock</p>
              <div className="mt-1"><PhtClockDisplay /></div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="relative mx-auto w-full px-3 pb-24 sm:px-5 sm:pb-8 lg:px-8 xl:px-10">
            <nav className="sticky top-0 z-40 -mx-3 flex min-h-14 items-center justify-between gap-3 border-b border-border/70 bg-background/92 px-3 backdrop-blur-xl sm:-mx-5 sm:px-5 lg:mx-0 lg:px-0">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground lg:hidden">
                  <TimerReset className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="block truncate text-sm font-bold tracking-tight lg:hidden">SIF Tracker</span>
                  <span className="hidden text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground lg:inline">Production workspace</span>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <div className="hidden sm:block"><PhtClockDisplay /></div>
                <button type="button" onClick={openQuickGuide} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1.5 text-[9px] font-bold shadow-sm transition hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Open Quick Guide">
                  <HelpCircle className="size-3" />
                  <span className="hidden sm:inline">Quick Guide</span>
                </button>
                <ThemeToggle />
              </div>
            </nav>

            <section className="py-5 sm:py-7 lg:flex lg:items-end lg:justify-between lg:gap-6">
              <div className="max-w-3xl">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/75 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <span className="size-1.5 animate-pulse rounded-full bg-[var(--sif-green)]" />
                  Compact Operations Dashboard
                </div>
                <h1 className="text-4xl font-bold tracking-[-0.06em] sm:text-5xl lg:text-6xl">SIF Tracker</h1>
                <p className="mt-2 max-w-2xl text-sm leading-5 text-muted-foreground">Know where your shift stands, what is taking the time, and when you are expected to finish.</p>
              </div>
              <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-xl border border-border bg-card/60 lg:mt-0 lg:w-[26rem]">
                <TopSummary label="Units" value={String(totalUnits)} />
                <TopSummary label="Work time" value={formatDuration(totalSeconds)} />
                <TopSummary label="Active" value={`${activeWorkloadCount}/${workloads.length}`} />
              </div>
            </section>

            <TodaySnapshot totalSeconds={totalSeconds} totalUnits={totalUnits} activeWorkloads={workloads.length} activeWorkloadCount={activeWorkloadCount} clockInTime={clockInTime} calculatedValues={calculatedValues} onClockInChange={setClockInTime} />

            <section id="calculator" className="scroll-mt-20 pt-1">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">01 / Workload</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight">Build today&apos;s workload</h2>
                  <p className="mt-1 text-[8px] font-medium leading-4 text-muted-foreground/70">⌨ Enter → next · ↑ ↓ adjust · Ctrl/Cmd+Enter → summary</p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 sm:shrink-0">
                  <button type="button" onClick={clearAllWorkloads} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-semibold shadow-sm transition hover:border-primary/30 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Clear all workload inputs">
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

              <div className="grid min-w-0 gap-3 lg:grid-cols-3">
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
              </div>
            </section>

            <section id="workflow" className={`${CARD_CLASS} scroll-mt-20 mt-4 overflow-hidden border-primary/25 p-4 sm:p-5`}>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><TimerReset className="size-3.5" /></div>
                    <div>
                      <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">02 / Summary</p>
                      <h3 className="mt-0.5 text-base font-semibold tracking-tight">One total, all workloads.</h3>
                    </div>
                  </div>
                  <p className="mt-2 max-w-xl text-[10px] leading-4 text-muted-foreground">{totalUnits} total units across {workloads.length} workload types. Use the live dashboard above to see where that time is going.</p>
                </div>
                <div className="rounded-xl border border-border bg-background/45 px-4 py-3 sm:min-w-[11rem] sm:text-right">
                  <span className="block text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Total work time</span>
                  <strong aria-live="polite" className="mt-1 block whitespace-nowrap font-mono text-2xl font-bold tracking-[-0.04em] tabular-nums sm:text-3xl">{formatDuration(totalSeconds)}</strong>
                </div>
              </div>
            </section>

            <section id="tools" className={`${CARD_CLASS} scroll-mt-20 mt-4 p-3.5 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-4`}>
              <div className="min-w-0">
                <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">03 / Tools</p>
                <p className="mt-1 text-[10px] leading-4 text-muted-foreground">Reset today&apos;s workload without changing your saved rates.</p>
              </div>
              <button type="button" onClick={() => setConfirmReset(true)} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-2 text-[10px] font-semibold transition hover:border-primary/30 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:mt-0 sm:w-auto">
                <RotateCcw className="size-3" />
                Reset today&apos;s workload
              </button>
            </section>

            <footer className="flex flex-col gap-1 py-4 text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>SIF Tracker</span>
              <span>Created by Nicole</span>
            </footer>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-[10px] font-semibold shadow-lg" role="status">
          <Check className="size-3 text-primary" />
          {feedback === 'saved' ? 'Rates saved' : feedback === 'reset' ? 'Workload reset' : 'All workloads cleared'}
        </div>
      )}

      {confirmReset && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="reset-title" onMouseDown={(event) => { if (event.currentTarget === event.target) setConfirmReset(false) }}>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Confirm reset</p>
                <h3 id="reset-title" className="mt-1 text-sm font-semibold">Reset today&apos;s workload?</h3>
                <p className="mt-1.5 text-[10px] leading-4 text-muted-foreground">This clears all workload inputs and resets Clock In to the current PHT time. Your saved rates stay unchanged.</p>
              </div>
              <button type="button" onClick={() => setConfirmReset(false)} className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Close reset confirmation"><X className="size-3.5" /></button>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setConfirmReset(false)} className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-[10px] font-bold hover:bg-accent">Cancel</button>
              <button type="button" onClick={performReset} className="flex-1 rounded-md bg-primary px-3 py-2 text-[10px] font-bold text-primary-foreground hover:opacity-90">Reset</button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 p-2 backdrop-blur-xl sm:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1.5">
          <MobileNavButton icon={<LayoutDashboard className="size-3.5" />} label="Shift" onClick={() => scrollTo('dashboard')} />
          <MobileNavButton icon={<Gauge className="size-3.5" />} label="Workload" onClick={() => scrollTo('calculator')} />
          <MobileNavButton icon={<TimerReset className="size-3.5" />} label="Summary" onClick={scrollToWorkflow} />
          <MobileNavButton icon={<Wrench className="size-3.5" />} label="Tools" onClick={() => scrollTo('tools')} />
        </div>
      </div>

      <ClockInPicker value={clockInTime} onChange={setClockInTime} />
    </main>
  )
}

function DashboardNavButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{icon}<span>{label}</span></button>
}

function MobileNavButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-[8px] font-bold text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{icon}<span>{label}</span></button>
}

function TopSummary({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 border-r border-border px-3 py-2.5 last:border-r-0"><span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</span><strong className="mt-1 block truncate font-mono text-[12px] font-bold tabular-nums">{value}</strong></div>
}
