'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Clock3, Minus, Plus, X } from 'lucide-react'

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function parseTime(value: string | undefined) {
  const [hour = '0', minute = '0', second = '0'] = (value ?? '09:00:00').split(':')
  return {
    hour: Math.max(0, Math.min(23, Number(hour) || 0)),
    minute: Math.max(0, Math.min(59, Number(minute) || 0)),
    second: Math.max(0, Math.min(59, Number(second) || 0)),
  }
}

function setControlledTime(value: string) {
  const input = document.querySelector<HTMLInputElement>('#shift input[type="time"]')
  if (!input) return

  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
  descriptor?.set?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

export function ClockInPicker() {
  const [open, setOpen] = useState(false)
  const [hour, setHour] = useState(9)
  const [minute, setMinute] = useState(0)
  const [second, setSecond] = useState(0)

  const currentValue = useMemo(() => `${pad(hour)}:${pad(minute)}:${pad(second)}`, [hour, minute, second])

  useEffect(() => {
    const handleClickCapture = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const trigger = target?.closest?.('button[aria-label^="Edit Clock In"]')
      if (!trigger) return

      event.preventDefault()
      event.stopPropagation()
      const input = document.querySelector<HTMLInputElement>('#shift input[type="time"]')
      const parsed = parseTime(input?.value)
      setHour(parsed.hour)
      setMinute(parsed.minute)
      setSecond(parsed.second)
      setOpen(true)
    }

    document.addEventListener('click', handleClickCapture, true)
    return () => document.removeEventListener('click', handleClickCapture, true)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  if (!open) return null

  const adjust = (setter: React.Dispatch<React.SetStateAction<number>>, value: number, delta: number, max: number) => {
    setter((value + delta + max + 1) % (max + 1))
  }

  const fields = [
    { label: 'Hour', value: hour, set: setHour, max: 23 },
    { label: 'Minute', value: minute, set: setMinute, max: 59 },
    { label: 'Second', value: second, set: setSecond, max: 59 },
  ]

  const picker = (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-3 backdrop-blur-[3px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clock-in-picker-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false)
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card font-mono text-foreground shadow-2xl">
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
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Close Clock In picker"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <div className="rounded-xl border border-border bg-background/60 px-4 py-5 text-center shadow-sm">
            <span className="block text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Selected time</span>
            <output className="mt-2 block font-mono text-4xl font-bold tracking-[-0.06em] tabular-nums text-primary sm:text-5xl">{currentValue}</output>
            <span className="mt-2 block text-[8px] font-medium text-muted-foreground">24-hour format · PHT</span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {fields.map((field) => (
              <div key={field.label} className="min-w-0 rounded-xl border border-border bg-background/45 p-2.5">
                <span className="block text-center text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{field.label}</span>
                <button type="button" onClick={() => adjust(field.set, field.value, 1, field.max)} className="mt-2 flex h-9 w-full items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-accent hover:text-foreground" aria-label={`Increase ${field.label}`}><Plus className="size-3.5" /></button>
                <div className="mt-1.5 flex h-14 w-full items-center justify-center rounded-lg bg-primary/10 font-mono text-2xl font-bold tabular-nums text-primary">{pad(field.value)}</div>
                <button type="button" onClick={() => adjust(field.set, field.value, -1, field.max)} className="mt-1.5 flex h-9 w-full items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-accent hover:text-foreground" aria-label={`Decrease ${field.label}`}><Minus className="size-3.5" /></button>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-[10px] font-bold transition hover:bg-accent">Cancel</button>
            <button
              type="button"
              onClick={() => {
                setControlledTime(currentValue)
                setOpen(false)
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-[10px] font-bold text-primary-foreground transition hover:opacity-90"
            >
              <Check className="size-3.5" />Apply time
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return typeof document === 'undefined' ? null : createPortal(picker, document.body)
}
