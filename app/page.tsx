'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CalculatorSection } from '@/components/calculator-section'
import { ClockInPicker } from '@/components/clock-in-picker'
import { DashboardHeader } from '@/components/dashboard-header'
import { FeedbackToast } from '@/components/feedback-toast'
import { ResetDialog } from '@/components/reset-dialog'
import { ShiftSummary } from '@/components/shift-summary'
import { ToolsSection } from '@/components/tools-section'
import { calculateValue } from '@/lib/calculator'
import { loadSavedRates, persistSavedRates } from '@/lib/rates-storage'
import { calculateWorkloads } from '@/lib/shift'
import { getCurrentClockIn } from '@/lib/use-philippine-clock'
import { clampRate, isValidWorkloadInput, validateRates } from '@/lib/validation'
import { DEFAULT_RATES, DEFAULT_WORKLOADS } from '@/lib/workloads'

type RateMap = Record<string, number>
type Feedback = 'saved' | 'reset' | 'copied' | 'cleared' | 'save-warning' | null

const EMPTY_VALUES = Object.fromEntries(DEFAULT_WORKLOADS.map(({ id }) => [id, '']))
const RATE_IDS = DEFAULT_WORKLOADS.map(({ id }) => id)

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
  const shiftRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const saved = loadSavedRates()
    if (!validateRates(saved, RATE_IDS)) {
      persistSavedRates(DEFAULT_RATES)
      setRates({ ...DEFAULT_RATES })
      setSavedRates({ ...DEFAULT_RATES })
    } else {
      setRates(saved)
      setSavedRates(saved)
    }
    setClockInTime(getCurrentClockIn())
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

  function updateValue(id: string, nextValue: string) {
    if (isValidWorkloadInput(nextValue)) {
      setValues((current) => ({ ...current, [id]: nextValue }))
    }
  }

  function adjustQuantity(id: string, delta: number) {
    const current = calculateValue(values[id] ?? '') ?? 0
    const next = Math.max(0, Math.round((current + delta) * 100) / 100)
    setValues((currentValues) => ({ ...currentValues, [id]: String(next) }))
  }

  function adjustRate(id: string, delta: number) {
    setRates((current) => ({ ...current, [id]: clampRate((current[id] ?? DEFAULT_RATES[id]) + delta) }))
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
    if (!Number.isFinite(parsed)) {
      setFeedback('save-warning')
      setEditingRate(null)
      setRateDraft('')
      return
    }
    setRates((current) => ({ ...current, [id]: clampRate(parsed) }))
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

  async function saveRates() {
    if (!validateRates(rates, RATE_IDS) || !persistSavedRates(rates)) {
      setFeedback('save-warning')
      return
    }

    try {
      const response = await fetch('/api/workloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rates }),
      })
      if (!response.ok) throw new Error('Rate validation failed')
    } catch {
      setSavedRates({ ...rates })
      setSettingsOpen(false)
      setFeedback('save-warning')
      return
    }

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

  async function copyClockOut(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setFeedback('copied')
    } catch {
      setFeedback(null)
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6 sm:pb-8 lg:px-8">
        <DashboardHeader onOpenQuickGuide={openQuickGuide} />

        <section className="py-5 sm:py-6">
          <div className="max-w-4xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <span className="size-1.5 animate-pulse rounded-full bg-[var(--sif-green)]" aria-hidden="true" />
              Production time calculator
            </div>
            <h1 className="text-4xl font-bold tracking-[-0.06em] sm:text-5xl lg:text-6xl">SIF Tracker</h1>
            <p className="mt-1.5 text-sm leading-5 text-muted-foreground">Enter your workload. Get your total time and clock-out instantly.</p>
          </div>
        </section>

        <CalculatorSection
          calculatedValues={calculatedValues}
          workloads={workloads}
          rates={rates}
          savedRates={savedRates}
          settingsOpen={settingsOpen}
          unsavedRates={unsavedRates}
          editingRate={editingRate}
          rateDraft={rateDraft}
          inputRefs={inputRefs}
          totalSeconds={totalSeconds}
          totalUnits={totalUnits}
          onClearAll={clearAllWorkloads}
          onToggleSettings={() => setSettingsOpen((open) => !open)}
          onAdjust={adjustQuantity}
          onChange={updateValue}
          onClear={clearWorkload}
          onSummaryShortcut={() => shiftRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          onAdjustRate={adjustRate}
          onBeginEdit={beginRateEdit}
          onDraftChange={setRateDraft}
          onCommitEdit={commitRateEdit}
          onCancelEdit={cancelRateEdit}
          onResetRates={resetRates}
          onSaveRates={saveRates}
          onCloseSettings={() => setSettingsOpen(false)}
        />

        <ShiftSummary
          totalSeconds={totalSeconds}
          totalUnits={totalUnits}
          clockInTime={clockInTime}
          shiftRef={shiftRef}
          onClockInChange={setClockInTime}
          onSetClockInNow={setClockInTime}
          onCopyClockOut={copyClockOut}
        />

        <ToolsSection onReset={() => setConfirmReset(true)} />

        <footer className="flex flex-col gap-1 py-4 text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>SIF Tracker</span>
          <span>Created by Nicole</span>
        </footer>
      </div>

      <FeedbackToast feedback={feedback} />
      <ResetDialog open={confirmReset} onClose={() => setConfirmReset(false)} onConfirm={performReset} />
      <ClockInPicker />
    </main>
  )
}
