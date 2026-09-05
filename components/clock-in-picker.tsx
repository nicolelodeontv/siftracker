'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Clock3, X } from 'lucide-react'
import { getCurrentClockIn } from '@/lib/use-philippine-clock'
import { Button } from '@/components/ui/button'

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function parseTime(value: string | undefined) {
  const [hour = '0', minute = '0', second = '0'] = (value ?? '00:00:00').split(':')
  return {
    hour: Math.max(0, Math.min(23, Number(hour) || 0)),
    minute: Math.max(0, Math.min(59, Number(minute) || 0)),
    second: Math.max(0, Math.min(59, Number(second) || 0)),
  }
}

function normalizeInput(value: string) {
  const digits = value.replace(/[^0-9]/g, '').slice(0, 6)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}:${digits.slice(2)}`
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}:${digits.slice(4, 6)}`
}

function validateTime(value: string) {
  const match = /^(\d{2}):(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  const second = Number(match[3])
  if (hour > 23 || minute > 59 || second > 59) return null
  return `${pad(hour)}:${pad(minute)}:${pad(second)}`
}

type Props = {
  value: string
  onChange: (value: string) => void
}

export function ClockInPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value || '00:00:00')
  const [error, setError] = useState(false)

  useEffect(() => {
    const handleOpen = () => {
      const parsed = parseTime(value)
      setDraft(`${pad(parsed.hour)}:${pad(parsed.minute)}:${pad(parsed.second)}`)
      setError(false)
      setOpen(true)
    }

    const handleSetNow = () => {
      onChange(getCurrentClockIn())
      setError(false)
      setOpen(false)
    }

    const handleClickCapture = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const trigger = target?.closest?.('button[aria-label^="Edit Clock In"]')
      if (!trigger) return
      event.preventDefault()
      event.stopPropagation()
      handleOpen()
    }

    document.addEventListener('sif:edit-clock-in', handleOpen as EventListener)
    document.addEventListener('sif:set-clock-in-now', handleSetNow as EventListener)
    document.addEventListener('click', handleClickCapture, true)
    return () => {
      document.removeEventListener('sif:edit-clock-in', handleOpen as EventListener)
      document.removeEventListener('sif:set-clock-in-now', handleSetNow as EventListener)
      document.removeEventListener('click', handleClickCapture, true)
    }
  }, [onChange, value])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        return
      }
      if (event.key === 'Enter') {
        const valid = validateTime(draft)
        if (!valid) {
          setError(true)
          return
        }
        event.preventDefault()
        onChange(valid)
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [draft, onChange, open])

  if (!open) return null

  const applyTime = () => {
    const valid = validateTime(draft)
    if (!valid) {
      setError(true)
      return
    }
    onChange(valid)
    setOpen(false)
  }

  const picker = (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-2 backdrop-blur-[3px] sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clock-in-picker-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false)
      }}
    >
      <div className="flex max-h-[calc(100dvh-1rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-2xl sm:max-h-[calc(100dvh-2rem)]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Clock3 className="size-3.5" /></span>
            <div className="min-w-0"><p className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">03 / Clock In</p><h2 id="clock-in-picker-title" className="mt-0.5 truncate font-mono text-sm font-semibold tracking-tight">Set Clock In</h2></div>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background/70 text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Close Clock In picker"><X className="size-4" /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
          <label htmlFor="clock-in-time-entry" className="block rounded-xl border border-border bg-background/60 px-4 py-4 text-center shadow-sm focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 sm:py-5">
            <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Clock In time</span>
            <input id="clock-in-time-entry" type="text" inputMode="numeric" autoComplete="off" value={draft} onChange={(event) => { setDraft(normalizeInput(event.target.value)); setError(false) }} onBlur={() => { const valid = validateTime(draft); if (valid) setDraft(valid) }} onFocus={() => setError(false)} maxLength={8} placeholder="HH:MM:SS" aria-invalid={error} aria-describedby={error ? 'clock-in-time-error' : undefined} className="mt-2 block w-full bg-transparent text-center font-mono text-3xl font-bold tracking-[-0.06em] tabular-nums text-primary outline-none sm:text-5xl" />
            <span className="mt-2 block font-mono text-[8px] font-medium text-muted-foreground">24-hour format · PHT</span>
          </label>

          {error && <p id="clock-in-time-error" className="mt-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-center font-mono text-[9px] font-semibold text-destructive">Enter a valid time from 00:00:00 to 23:59:59.</p>}

          <div className="mt-3 rounded-xl border border-border bg-background/45 px-3 py-2.5"><p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Example</p><p className="mt-1 font-mono text-[9px] leading-4 text-muted-foreground">09:00:00 · 13:30:00 · 18:45:30</p></div>
        </div>

        <div className="shrink-0 border-t border-border bg-card px-4 py-3 sm:px-5 sm:py-4">
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" size="lg" onClick={() => setOpen(false)} className="w-full font-mono text-[9px] font-bold">
              Cancel
            </Button>
            <Button type="button" variant="default" size="lg" onClick={applyTime} className="w-full font-mono text-[9px] font-bold">
              <Check className="size-3" />Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  return typeof document === 'undefined' ? null : createPortal(picker, document.body)
}
