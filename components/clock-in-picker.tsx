'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Clock3, X } from 'lucide-react'

const DEFAULT_TIME = '09:00:00'

function normalizeTime(value: string | undefined) {
  if (!value) return DEFAULT_TIME
  const parts = value.split(':').map(Number)
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return DEFAULT_TIME
  const [hour, minute, second] = parts
  return `${String(Math.min(23, Math.max(0, hour))).padStart(2, '0')}:${String(Math.min(59, Math.max(0, minute))).padStart(2, '0')}:${String(Math.min(59, Math.max(0, second))).padStart(2, '0')}`
}

function getHiddenClockInput() {
  return document.querySelector<HTMLInputElement>('#shift input[type="time"]')
}

function readClockIn() {
  return normalizeTime(getHiddenClockInput()?.value)
}

function writeClockIn(value: string) {
  const input = getHiddenClockInput()
  if (!input) return

  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

export function ClockInPicker() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(DEFAULT_TIME)

  useEffect(() => {
    const handleTrigger = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const trigger = target?.closest?.('button[aria-label^="Edit Clock In"]')
      if (!trigger) return

      event.preventDefault()
      event.stopPropagation()
      setDraft(readClockIn())
      setOpen(true)
    }

    document.addEventListener('click', handleTrigger, true)
    return () => document.removeEventListener('click', handleTrigger, true)
  }, [])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
      }

      if (event.key === 'Enter') {
        const target = event.target as HTMLElement | null
        if (target?.tagName === 'INPUT') return
        event.preventDefault()
        writeClockIn(normalizeTime(draft))
        setOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, draft])

  if (!open || typeof document === 'undefined') return null

  const apply = () => {
    writeClockIn(normalizeTime(draft))
    setOpen(false)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-3 backdrop-blur-[3px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clock-in-picker-title"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) setOpen(false)
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Clock3 className="size-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">03 / Shift Summary</p>
              <h2 id="clock-in-picker-title" className="mt-0.5 truncate text-sm font-semibold tracking-tight">Set Clock In</h2>
            </div>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground" aria-label="Close Clock In picker">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5">
          <label htmlFor="clock-in-time-picker" className="block text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Clock In time
          </label>
          <input
            id="clock-in-time-picker"
            type="time"
            step="1"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="mt-2 h-14 w-full rounded-xl border border-input bg-background px-4 text-center font-mono text-2xl font-bold tabular-nums outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            aria-label="Clock In time"
            autoFocus
          />
          <p className="mt-2 text-center text-[8px] font-medium text-muted-foreground">24-hour format · PHT</p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-[10px] font-bold transition hover:bg-accent">Cancel</button>
            <button type="button" onClick={apply} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-[10px] font-bold text-primary-foreground transition hover:opacity-90">
              <Check className="size-3.5" />Apply time
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
