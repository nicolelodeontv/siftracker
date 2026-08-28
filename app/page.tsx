'use client'

import { Fragment, useMemo, useState } from 'react'
import { ArrowUpRight, RotateCcw, TimerReset } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

type Workload = {
  id: string
  label: string
  unit: string
  minutesPerUnit: number
  accent: string
  examples: string[]
}

const workloads: Workload[] = [
  {
    id: 'teamEdit',
    label: 'Team edit',
    unit: 'teams',
    minutesPerUnit: 15,
    accent: 'var(--chart-1)',
    examples: ['1 team = 15m', '4 teams = 1h', '16 teams = 4h', '32 teams = 8h'],
  },
  {
    id: 'indiClip',
    label: 'Indi clip',
    unit: 'indis',
    minutesPerUnit: 5,
    accent: 'var(--chart-2)',
    examples: ['1 indi = 5m', '12 indi = 1h', '48 indi = 4h', '96 indi = 8h'],
  },
  {
    id: 'indiEdit',
    label: 'Indi edit',
    unit: 'indis',
    minutesPerUnit: 5,
    accent: 'var(--chart-3)',
    examples: ['1 indi = 5m', '12 indi = 1h', '48 indi = 4h', '96 indi = 8h'],
  },
  {
    id: 'indiBuild',
    label: 'Indi build',
    unit: 'orders',
    minutesPerUnit: 4,
    accent: 'var(--chart-4)',
    examples: ['1 order = 4m', '15 orders = 1h', '60 orders = 4h', '120 orders = 8h'],
  },
  {
    id: 'lateOrders',
    label: 'Late orders',
    unit: 'orders',
    minutesPerUnit: 15,
    accent: 'var(--chart-5)',
    examples: ['1 order = 15m', '4 orders = 1h', '16 orders = 4h', '32 orders = 8h'],
  },
]

function formatDuration(totalMinutes: number) {
  if (totalMinutes === 0) return '0 mins'
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (!hours) return `${minutes} ${minutes === 1 ? 'min' : 'mins'}`
  if (!minutes) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  return `${hours}h ${minutes}m`
}

export default function Page() {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(workloads.map((workload) => [workload.id, ''])),
  )

  function calculateValue(value: string): number | null {
    const normalized = value.replace(/\s+/g, '')
    if (!normalized || normalized.length > 200 || !/^[\d+*/().=-]+$/.test(normalized)) return null

    const [expression, declaredTotal] = normalized.split('=')
    if (!expression || normalized.split('=').length > 2 || normalized.endsWith('=')) return null

    try {
      const tokens = expression.match(/\d+(?:\.\d+)?|[()+*/-]/g) ?? []
      if (tokens.join('') !== expression) return null
      const parseExpression = (index: { value: number }): number => {
        let result = parseTerm(index)
        while (tokens[index.value] === '+' || tokens[index.value] === '-') {
          const operator = tokens[index.value++]
          const next = parseTerm(index)
          result = operator === '+' ? result + next : result - next
        }
        return result
      }
      const parseTerm = (index: { value: number }): number => {
        let result = parseFactor(index)
        while (tokens[index.value] === '*' || tokens[index.value] === '/') {
          const operator = tokens[index.value++]
          const next = parseFactor(index)
          if (operator === '/' && next === 0) throw new Error('division by zero')
          result = operator === '*' ? result * next : result / next
        }
        return result
      }
      const parseFactor = (index: { value: number }): number => {
        const token = tokens[index.value++]
        if (token === '(') {
          const result = parseExpression(index)
          if (tokens[index.value++] !== ')') throw new Error('unclosed expression')
          return result
        }
        if (token === '-') return -parseFactor(index)
        if (!token || Number.isNaN(Number(token))) throw new Error('invalid expression')
        return Number(token)
      }
      const index = { value: 0 }
      const result = parseExpression(index)
      if (index.value !== tokens.length || !Number.isFinite(result) || Math.abs(result) > 1_000_000) return null
      const roundedResult = Number.isInteger(result) ? result : Number(result.toFixed(2))
      if (declaredTotal !== undefined && Number(declaredTotal) !== roundedResult) return null
      return roundedResult
    } catch {
      return null
    }
  }

  const totalMinutes = useMemo(
    () => workloads.reduce((total, workload) => total + (calculateValue(values[workload.id]) ?? 0) * workload.minutesPerUnit, 0),
    [values],
  )

  function updateValue(id: string, value: string) {
    if (!/^[\d+*/().=\s-]*$/.test(value)) return
    setValues((current) => ({ ...current, [id]: value }))
  }

  function reset() {
    setValues(Object.fromEntries(workloads.map((workload) => [workload.id, ''])))
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 opacity-[0.45] [background-image:radial-gradient(circle_at_1px_1px,var(--grid-dot)_1px,transparent_0)] [background-size:24px_24px]" />

      <div className="relative mx-auto w-full max-w-6xl px-5 pb-12 sm:px-8 lg:px-10">
        <nav className="flex h-20 items-center justify-between border-b border-border/80">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <TimerReset className="size-4" aria-hidden="true" />
            </div>
            <div className="leading-none">
              <span className="block text-sm font-bold tracking-tight">SIF Tracker</span>
              <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Operations</span>
            </div>
          </div>

          <div className="hidden items-center gap-7 text-xs font-semibold text-muted-foreground md:flex">
            <a href="#calculator" className="text-foreground transition hover:text-primary">Calculator</a>
            <a href="#workflow" className="transition hover:text-foreground">Workflow</a>
            <a href="#about" className="transition hover:text-foreground">About</a>
          </div>

          <ThemeToggle />
        </nav>

        <section className="relative py-16 sm:py-20 lg:py-24">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground shadow-sm backdrop-blur">
              <span className="size-1.5 rounded-full bg-[var(--sif-green)]" aria-hidden="true" />
              Production time calculator
            </div>
            <h1 className="max-w-4xl text-balance text-5xl font-bold tracking-[-0.06em] text-foreground sm:text-6xl lg:text-8xl">
              Plan the workload.<br />
              <span className="text-primary">Know the time.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-pretty text-sm leading-7 text-muted-foreground sm:text-base">
              A fast, focused way to estimate production time across team edits, individual work, builds, and late orders.
            </p>
          </div>
        </section>

        <section id="calculator" aria-labelledby="calculator-heading" className="scroll-mt-24">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">01 / Calculator</p>
              <h2 id="calculator-heading" className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Enter your workload</h2>
            </div>
            <div className="font-mono text-[11px] text-muted-foreground">Updates instantly</div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {workloads.map((workload, index) => {
              const calculated = calculateValue(values[workload.id])
              return (
                <Fragment key={workload.id}>
                  <article className="group rounded-2xl border border-border bg-card/85 p-5 shadow-[0_12px_40px_var(--card-shadow)] backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-primary/30 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: workload.accent }} />
                        <div>
                          <h3 className="text-base font-semibold tracking-tight">{workload.label}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">{workload.minutesPerUnit} minutes per {workload.unit.slice(0, -1)}</p>
                        </div>
                      </div>
                      <output aria-live="polite" className="font-mono text-right text-lg font-bold tabular-nums" style={{ color: workload.accent }}>
                        {formatDuration((calculated ?? 0) * workload.minutesPerUnit)}
                      </output>
                    </div>

                    <label className="mt-6 block">
                      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Number of {workload.unit}</span>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={values[workload.id]}
                          onChange={(event) => updateValue(workload.id, event.target.value)}
                          aria-label={`${workload.label} ${workload.unit}`}
                          placeholder="0"
                          className="h-14 w-full rounded-xl border border-input bg-background/70 px-4 pr-20 font-mono text-lg font-medium tabular-nums outline-none transition placeholder:text-muted-foreground/40 focus:border-primary focus:ring-4 focus:ring-primary/10"
                        />
                        {calculated !== null && (
                          <output className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-mono text-lg font-semibold tabular-nums text-muted-foreground" aria-label="Calculated result">
                            {calculated}
                          </output>
                        )}
                      </div>
                    </label>

                    <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border pt-4 sm:grid-cols-4">
                      {workload.examples.map((example) => (
                        <span key={example} className="font-mono text-[10px] font-semibold leading-5 tracking-tight text-muted-foreground transition group-hover:text-foreground">{example}</span>
                      ))}
                    </div>
                  </article>

                  {index === 1 && (
                    <section id="workflow" className="scroll-mt-24 rounded-2xl border border-primary/20 bg-primary p-6 text-primary-foreground shadow-[0_18px_60px_var(--primary-shadow)] sm:p-7">
                      <div className="flex h-full flex-col justify-between gap-8 sm:flex-row sm:items-end">
                        <div className="max-w-md">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">02 / Workflow</p>
                          <h3 className="mt-2 text-xl font-semibold tracking-tight">One total, all workloads.</h3>
                          <p className="mt-2 text-xs leading-6 opacity-75">Keep entering quantities above. The combined estimate is always calculated from the current values.</p>
                        </div>
                        <div className="sm:text-right">
                          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] opacity-60">Combined total</span>
                          <strong className="mt-1 block font-mono text-3xl font-bold tracking-[-0.04em] tabular-nums sm:text-4xl">{formatDuration(totalMinutes)}</strong>
                        </div>
                      </div>
                    </section>
                  )}
                </Fragment>
              )
            })}
          </div>
        </section>

        <section id="about" className="mt-16 scroll-mt-24 border-y border-border py-8 sm:mt-20 sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">03 / About</p>
            <p className="mt-2 max-w-xl text-xs leading-6 text-muted-foreground">Built as a simple internal production planning tool. Type numbers or expressions such as <span className="font-mono text-foreground">4*3</span> directly into any field.</p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="mt-5 inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-semibold transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:mt-0"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Reset all
            <ArrowUpRight className="size-3.5 opacity-50" aria-hidden="true" />
          </button>
        </section>

        <footer className="flex flex-col gap-2 py-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>SIF Tracker</span>
          <span>Created by Nicole</span>
        </footer>
      </div>
    </main>
  )
}
