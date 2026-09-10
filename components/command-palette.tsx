'use client'

import { useEffect, useMemo, useState } from 'react'
import { Command, Gauge, HelpCircle, LayoutDashboard, RotateCcw, Search, Settings2, TimerReset, Wrench, X } from 'lucide-react'

const ACTIONS = [
  { id: 'dashboard', label: 'Go to Live Shift', hint: 'Dashboard overview', icon: LayoutDashboard },
  { id: 'workload', label: 'Go to Workload', hint: 'Enter today\'s workload', icon: Gauge },
  { id: 'summary', label: 'Go to Summary', hint: 'Review shift totals', icon: TimerReset },
  { id: 'tools', label: 'Go to Tools', hint: 'Shift utilities', icon: Wrench },
  { id: 'settings', label: 'Open Settings', hint: 'Edit workload rates', icon: Settings2 },
  { id: 'guide', label: 'Open Quick Guide', hint: 'Keyboard shortcuts & help', icon: HelpCircle },
  { id: 'clear', label: 'Clear All Workloads', hint: 'Remove current entries', icon: RotateCcw },
  { id: 'reset', label: 'Reset Today\'s Workload', hint: 'Clear workload and reset clock-in', icon: RotateCcw },
] as const

type ActionId = (typeof ACTIONS)[number]['id']

function clickButton(selector: string) {
  document.querySelector<HTMLButtonElement>(selector)?.click()
}

function runAction(id: ActionId) {
  if (id === 'dashboard') document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  if (id === 'workload') document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  if (id === 'summary') document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  if (id === 'tools') document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  if (id === 'settings') clickButton('button[aria-controls="settings"]')
  if (id === 'guide') window.dispatchEvent(new Event('sif:open-welcome'))
  if (id === 'clear') clickButton('button[aria-label="Clear all workload inputs"]')
  if (id === 'reset') {
    const resetButton = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find((button) => button.textContent?.includes("Reset today's workload"))
    resetButton?.click()
  }
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return ACTIONS
    return ACTIONS.filter((action) => `${action.label} ${action.hint}`.toLowerCase().includes(normalized))
  }, [query])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const commandShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
      if (commandShortcut) {
        event.preventDefault()
        setOpen((current) => !current)
        return
      }

      if (!open) return
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((current) => Math.min(current + 1, Math.max(filtered.length - 1, 0)))
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((current) => Math.max(current - 1, 0))
      }
      if (event.key === 'Enter' && filtered[activeIndex]) {
        event.preventDefault()
        runAction(filtered[activeIndex].id)
        setOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [activeIndex, filtered, open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => document.getElementById('sif-command-search')?.focus(), 0)
    return () => window.clearTimeout(timer)
  }, [open])

  function openPalette() {
    setOpen(true)
    setQuery('')
    setActiveIndex(0)
  }

  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        className="fixed bottom-4 left-4 z-40 inline-flex items-center gap-2 rounded-full border border-border bg-card/95 px-3 py-2 text-[11px] font-semibold text-foreground shadow-lg backdrop-blur-xl transition hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:bottom-5 sm:left-auto sm:right-5"
        aria-label="Open Quick Actions"
      >
        <Command className="size-3.5" />
        <span>Quick Actions</span>
        <kbd className="hidden rounded-md border border-border bg-background/70 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground sm:inline">⌘K</kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/45 px-3 pt-[12vh] backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false)
          }}
        >
          <section
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sif-command-title"
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                id="sif-command-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search actions..."
                className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
                aria-label="Search Quick Actions"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Close Quick Actions"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="px-4 pt-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p id="sif-command-title" className="text-sm font-bold">Quick Actions</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Jump around the workspace or trigger common shift actions.</p>
                </div>
                <div className="hidden items-center gap-1 text-[9px] font-medium text-muted-foreground sm:flex">
                  <kbd className="rounded border border-border px-1.5 py-1 font-mono">↑↓</kbd>
                  <kbd className="rounded border border-border px-1.5 py-1 font-mono">Enter</kbd>
                </div>
              </div>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-2.5" role="listbox" aria-label="Quick Actions">
              {filtered.length ? filtered.map((action, index) => {
                const Icon = action.icon
                const active = index === activeIndex
                return (
                  <button
                    key={action.id}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => {
                      runAction(action.id)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? 'bg-accent' : 'hover:bg-accent/70'}`}
                    role="option"
                    aria-selected={active}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background/70 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold leading-5">{action.label}</span>
                      <span className="block text-[11px] leading-4 text-muted-foreground">{action.hint}</span>
                    </span>
                    {active && <span className="hidden text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:inline">Enter</span>}
                  </button>
                )
              }) : (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm font-bold">No actions found</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Try “workload”, “settings”, or “reset”.</p>
                </div>
              )}
            </div>

            <div className="border-t border-border px-4 py-2.5 text-[10px] font-medium text-muted-foreground">
              Press <kbd className="rounded border border-border bg-background/70 px-1.5 py-0.5 font-mono">Esc</kbd> to close · <kbd className="rounded border border-border bg-background/70 px-1.5 py-0.5 font-mono">Ctrl/⌘ K</kbd> to toggle
            </div>
          </section>
        </div>
      )}
    </>
  )
}
